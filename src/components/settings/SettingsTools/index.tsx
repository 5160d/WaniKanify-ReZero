import React, { useEffect, useRef, useState } from "react"
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Snackbar,
  Stack,
  Tooltip,
  Typography
} from "@mui/material"
import { Delete, Download, Restore, Upload, Sync } from "@mui/icons-material"
import { Storage } from "@plasmohq/storage"

import type { ChangingProps } from "~src/components/common/types"
import type { WaniSettings, WaniSettingsFormImpl } from "~src/components/settings/types"
import {
  waniSettingsDeserializer,
  waniSettingsSerializer
} from "~src/components/settings/types"

type BackupRecord = {
  id: string
  name: string
  createdAt: string
  data: string
}

const BACKUP_STORAGE_KEY = "wanikanify:settingsBackups"

const backupStorage = new Storage({
  area: "local"
})

const createId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2))

interface SettingsToolsProps {
  settingsForm: WaniSettingsFormImpl
  onImportSettings: (settings: WaniSettings) => void
  onValidationReset: () => void
  onResetDefaults: () => void
  onSyncFromCloud: () => Promise<void>
}

const downloadJson = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const serializeSettings = (settings: WaniSettings): string =>
  JSON.stringify(settings, waniSettingsSerializer, 2)

const deserializeSettings = (json: string): WaniSettings =>
  JSON.parse(json, waniSettingsDeserializer)

export const SettingsTools: React.FC<SettingsToolsProps> = ({
  settingsForm,
  onImportSettings,
  onValidationReset,
  onResetDefaults,
  onSyncFromCloud
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success"
  })

  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }))

  const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
    setSnackbar({ open: true, message, severity })
  }

  const loadBackups = async () => {
    const stored = (await backupStorage.get<BackupRecord[]>(BACKUP_STORAGE_KEY)) ?? []
    setBackups(stored.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  useEffect(() => {
    void loadBackups()
  }, [])

  const handleExport = () => {
    try {
      const settings = settingsForm.toWaniSettings()
      const json = serializeSettings(settings)
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      downloadJson(`wanikanify-settings-${timestamp}.json`, json)
      showSnackbar("Settings exported successfully")
    } catch (error) {
      console.error("WaniKanify: export failed", error)
      showSnackbar("Failed to export settings", "error")
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const importedSettings = deserializeSettings(text)
      onImportSettings(importedSettings)
      onValidationReset()
      showSnackbar("Settings imported")
    } catch (error) {
      console.error("WaniKanify: import failed", error)
      showSnackbar("Failed to import settings", "error")
    } finally {
      event.target.value = ""
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleCreateBackup = async () => {
    try {
      const settings = settingsForm.toWaniSettings()
      const serialized = serializeSettings(settings)
      const newBackup: BackupRecord = {
        id: createId(),
        name: `Backup ${new Date().toLocaleString()}`,
        createdAt: new Date().toISOString(),
        data: serialized
      }

      const updatedBackups = [newBackup, ...backups].slice(0, 10)
      await backupStorage.set(BACKUP_STORAGE_KEY, updatedBackups)
      setBackups(updatedBackups)
      showSnackbar("Backup created")
    } catch (error) {
      console.error("WaniKanify: backup failed", error)
      showSnackbar("Failed to create backup", "error")
    }
  }

  const handleRestoreBackup = async (backup: BackupRecord) => {
    try {
      const settings = deserializeSettings(backup.data)
      onImportSettings(settings)
      onValidationReset()
      showSnackbar(`Restored ${backup.name}`)
    } catch (error) {
      console.error("WaniKanify: restore failed", error)
      showSnackbar("Failed to restore backup", "error")
    }
  }

  const handleDeleteBackup = async (backup: BackupRecord) => {
    const updatedBackups = backups.filter((record) => record.id !== backup.id)
    await backupStorage.set(BACKUP_STORAGE_KEY, updatedBackups)
    setBackups(updatedBackups)
    showSnackbar("Backup deleted")
  }

  const handleResetDefaults = () => {
    if (confirm('Reset all settings to their default values?')) {
      onResetDefaults()
      onValidationReset()
      showSnackbar('Settings reset to defaults')
    }
  }

  const handleSync = async () => {
    await onSyncFromCloud()
    onValidationReset()
    showSnackbar('Fetched latest synced settings')
  }

  const hasBackups = backups.length > 0

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6" color="text.primary">
            Settings Tools
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExport}
            >
              Export Settings
            </Button>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={handleImportClick}
            >
              Import Settings
            </Button>
            <Button
              variant="outlined"
              startIcon={<Restore />}
              onClick={handleCreateBackup}
            >
              Create Backup
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleResetDefaults}
            >
              Reset Defaults
            </Button>
            <Button
              variant="text"
              startIcon={<Sync />}
              onClick={handleSync}
            >
              Pull from Sync
            </Button>
            <input
              type="file"
              accept="application/json"
              ref={fileInputRef}
              onChange={handleImport}
              style={{ display: "none" }}
            />
          </Stack>

          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Typography variant="subtitle1">Backups</Typography>
              <Chip label={`${backups.length}`} size="small" />
            </Stack>
            {hasBackups ? (
              <List disablePadding>
                {backups.map((backup) => (
                  <ListItem key={backup.id} divider>
                    <ListItemText
                      primary={backup.name}
                      secondary={new Date(backup.createdAt).toLocaleString()}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Restore">
                        <IconButton
                          edge="end"
                          onClick={() => handleRestoreBackup(backup)}
                          sx={{ mr: 1 }}
                        >
                          <Restore />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton edge="end" onClick={() => handleDeleteBackup(backup)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No backups yet. Create one to capture your current configuration.
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Card>
  )
}

export default SettingsTools

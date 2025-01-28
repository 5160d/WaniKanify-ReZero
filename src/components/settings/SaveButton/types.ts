export interface SaveStatus {
    status: "idle" | "pending" | "success" | "error";
    message: string;
}

export interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}
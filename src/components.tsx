import React, { useState } from "react"

import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';


export const APITokenField = () => {

    return (
        <Input
            placeholder="API Token"
            endDecorator={
                <Button variant="soft" color="primary">
                    Test API Token
                </Button>
            }
        />
    )
}
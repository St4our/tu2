// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

type ApiError = {
    server_error_id?: string;
    stack?: string;
    message: string;
    status_code?: number;
};

'use client';

import * as React from 'react';

export default function ClientBody({ children }: { children: React.ReactNode }) {
    return (
        <body className="antialiased font-sans" onContextMenu={(e) => e.preventDefault()}>
            {children}
        </body>
    );
}


"use client";

import { Turnstile } from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
    onExpire?: () => void;
}

export default function TurnstileWidget({
    onVerify,
    onExpire,
}: TurnstileWidgetProps) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
        return <p>Turnstile Site Key belum dikonfigurasi.</p>;
    }

    return (
        <Turnstile
            siteKey={siteKey}
            onSuccess={onVerify}
            onExpire={onExpire}
            options={{
                theme: "light",
                size: "normal",
            }}
        />
    );
}

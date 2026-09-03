<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $emailSubject }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 30px 15px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                    
                    <!-- Header with Gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #065f46 0%, #047857 50%, #1e293b 100%); padding: 32px 30px; text-align: left;">
                            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
                                Персональне звернення
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; line-height: 1.3;">
                                Миколаївський національний аграрний університет
                            </h1>
                            <p style="margin: 4px 0 0; color: #a7f3d0; font-size: 12px; font-weight: 500;">
                                Студентське містечко • {{ $senderRole }}
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 32px 30px;">
                            
                            <!-- Sender Information Chip -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td>
                                            <span style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: block;">
                                                Від кого:
                                            </span>
                                            <strong style="font-size: 14px; color: #0f172a;">{{ $sender->name }}</strong>
                                            <span style="font-size: 12px; color: #059669; font-weight: 600;"> ({{ $senderRole }})</span>
                                        </td>
                                        <td align="right" style="font-size: 11px; color: #94a3b8;">
                                            {{ now()->format('d.m.Y H:i') }}
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Subject -->
                            <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 17px; font-weight: 800; line-height: 1.4;">
                                {{ $emailSubject }}
                            </h2>

                            <!-- Greeting -->
                            <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.6;">
                                Доброго дня, <strong>{{ $student->name }}</strong>! До вас звертається {{ mb_strtolower($senderRole) }}:
                            </p>

                            <!-- Message Content -->
                            <div style="background-color: #ecfdf5; border-left: 4px solid #059669; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                                <p style="margin: 0; font-size: 13px; color: #064e3b; line-height: 1.8; white-space: pre-line;">
{{ $emailMessage }}
                                </p>
                            </div>

                            <!-- Reply hint -->
                            <div style="background-color: #f1f5f9; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; text-align: left;">
                                <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
                                    Ви можете відповісти на цей лист прямо у своїй пошті — відповідь надійде безпосередньо на адресу відправника:
                                    <strong style="color: #0f172a;">{{ $sender->email }}</strong>.
                                </p>
                            </div>

                            <!-- Button CTA -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center">
                                        <a href="{{ route('dashboard') }}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">
                                            Увійти в кабінет студента →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
                            <p style="margin: 0 0 4px; font-size: 11px; color: #94a3b8;">
                                Миколаївський національний аграрний університет • Студентське містечко
                            </p>
                            <p style="margin: 0; font-size: 10px; color: #cbd5e1;">
                                Лист надіслано співробітником адміністрації через внутрішню систему управління гуртожитками МНАУ.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

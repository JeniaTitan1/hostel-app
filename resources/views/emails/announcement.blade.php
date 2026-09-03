<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $announcement->title }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 30px 15px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                    
                    <!-- Header with Gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #047857 0%, #065f46 50%, #0f172a 100%); padding: 32px 30px; text-align: left;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td>
                                        <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
                                            {{ $buildingName }}
                                        </div>
                                        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; line-height: 1.3;">
                                            Миколаївський національний аграрний університет
                                        </h1>
                                        <p style="margin: 4px 0 0; color: #a7f3d0; font-size: 12px; font-weight: 500;">
                                            Студентське містечко • Офіційне повідомлення
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 32px 30px;">
                            
                            <!-- Priority Badge & Date -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                                <tr>
                                    <td>
                                        @if($announcement->priority === 'important')
                                            <span style="display: inline-block; background-color: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 12px; text-transform: uppercase;">
                                                Важливе оголошення
                                            </span>
                                        @elseif($announcement->priority === 'event')
                                            <span style="display: inline-block; background-color: #f3e8ff; border: 1px solid #e9d5ff; color: #7e22ce; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 12px; text-transform: uppercase;">
                                                Захід / Подія
                                            </span>
                                        @else
                                            <span style="display: inline-block; background-color: #e0f2fe; border: 1px solid #bae6fd; color: #0369a1; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 12px; text-transform: uppercase;">
                                                Інформація
                                            </span>
                                        @endif
                                    </td>
                                    <td align="right" style="font-size: 11px; color: #94a3b8; font-weight: 500;">
                                        {{ $announcement->created_at ? $announcement->created_at->format('d.m.Y H:i') : now()->format('d.m.Y H:i') }}
                                    </td>
                                </tr>
                            </table>

                            <!-- Title -->
                            <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; font-weight: 800; line-height: 1.4;">
                                {{ $announcement->title }}
                            </h2>

                            <!-- Greeting -->
                            <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.6;">
                                Вітаємо, <strong>{{ $student->name }}</strong>! Доводимо до вашого відома важливе повідомлення від адміністрації гуртожитку:
                            </p>

                            <!-- Content Box -->
                            <div style="background-color: #f8fafc; border-left: 4px solid #059669; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
                                <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.7; white-space: pre-line;">
{{ $announcement->content }}
                                </p>
                            </div>

                            <!-- Button CTA -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ route('dashboard') }}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">
                                            Перейти в особистий кабінет студента →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
                                Якщо у вас виникли запитання, ви можете звернутися до свого коменданта або подати заявку через розділ технічної підтримки в особистому кабінеті.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
                            <p style="margin: 0 0 4px; font-size: 11px; color: #94a3b8;">
                                Миколаївський національний аграрний університет • Студентське містечко
                            </p>
                            <p style="margin: 0; font-size: 10px; color: #cbd5e1;">
                                Цей лист надіслано автоматично, оскільки ви зареєстровані у системі поселення студентів.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

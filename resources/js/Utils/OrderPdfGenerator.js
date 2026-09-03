import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

export const generateOrderPdf = async ({ user, booking }) => {
    if (!booking || !user) return;

    const currentYear = new Date().getFullYear();
    const orderNumber = booking.order_number || `ORD-${currentYear}-PENDING`;
    const issueDate = new Date().toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    const verificationUrl = `${window.location.origin}/verify-order/${encodeURIComponent(orderNumber)}`;

    let qrCodeDataUrl = '';
    try {
        qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 320,
            margin: 1,
            color: {
                dark: '#064e3b',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
        });
    } catch (qrErr) {
        console.warn('QR code generation error:', qrErr);
    }

    // Створюємо тимчасовий DOM-контейнер для документа
    const container = document.createElement('div');
    container.id = 'pdf-order-export-container';
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '794px'; // A4 пропорції при 96 DPI
    container.style.padding = '32px';
    container.style.boxSizing = 'border-box';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = "Arial, 'Helvetica Neue', Helvetica, sans-serif";
    container.style.color = '#0f172a';
    container.style.zIndex = '-99999';
    container.style.pointerEvents = 'none';

    container.innerHTML = `
        <div style="border: 3px double #059669; padding: 28px; border-radius: 12px; position: relative; background: #ffffff; box-sizing: border-box; width: 100%;">
            <!-- Водяний знак / Фоновий щит -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.025; font-size: 240px; font-weight: 900; color: #059669; pointer-events: none; user-select: none; line-height: 1;">
                МНАУ
            </div>

            <!-- Шапка документа -->
            <div style="text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 4px; line-height: 1.2;">
                    Міністерство освіти і науки України
                </div>
                <div style="font-size: 16px; font-weight: 900; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; line-height: 1.2;">
                    Миколаївський Національний Аграрний Університет
                </div>
                <div style="font-size: 12px; font-weight: 600; color: #047857; line-height: 1.2;">
                    Студентське містечко • Відділ поселення та обліку
                </div>
            </div>

            <!-- Заголовок Ордера -->
            <div style="text-align: center; margin-bottom: 22px;">
                <table style="margin: 0 auto 8px auto; border-collapse: collapse; display: inline-table; vertical-align: middle;">
                    <tr>
                        <td style="background: #ecfdf5; border: 1.5px solid #a7f3d0; color: #047857; font-size: 10px; font-weight: 800; padding: 5px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; text-align: center; vertical-align: middle; line-height: 1.2;">
                            <span style="position: relative; top: -10px; display: inline-block;">ОФІЦІЙНИЙ ЕЛЕКТРОННИЙ ДОКУМЕНТ</span>
                        </td>
                    </tr>
                </table>
                <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 1px; line-height: 1.2;">
                    ОРДЕР НА ЗАСЕЛЕННЯ № ${orderNumber}
                </h1>
                <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-top: 5px; line-height: 1.2;">
                    Дата видачі: ${issueDate} р.
                </div>
            </div>

            <!-- Блок студентської інформації -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 18px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #047857; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; letter-spacing: 0.5px;">
                    Відомості про студента / мешканця
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #64748b; width: 35%; vertical-align: middle;">ПІБ студента:</td>
                        <td style="padding: 6px 0; font-weight: 800; color: #0f172a; vertical-align: middle;">${user.name || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #64748b; vertical-align: middle;">Електронна пошта:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: middle;">${user.email || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #64748b; vertical-align: middle;">Контактний телефон:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: middle;">${user.phone || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #64748b; vertical-align: middle;">Напрям / Спеціальність:</td>
                        <td style="padding: 6px 0; font-weight: 700; color: #0f172a; vertical-align: middle;">${user.specialty || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #64748b; vertical-align: middle;">Курс та група:</td>
                        <td style="padding: 6px 0; font-weight: 700; color: #0f172a; vertical-align: middle;">${user.course ? `${user.course} курс` : '-'} ${user.group ? `(Група ${user.group})` : ''}</td>
                    </tr>
                </table>
            </div>

            <!-- Блок місця проживання -->
            <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin-bottom: 18px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #15803d; margin-bottom: 8px; border-bottom: 1px solid #86efac; padding-bottom: 5px; letter-spacing: 0.5px;">
                    Виділене місце проживання
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #166534; width: 35%; vertical-align: middle;">Гуртожиток:</td>
                        <td style="padding: 6px 0; font-weight: 900; color: #14532d; font-size: 14px; vertical-align: middle;">${booking.room?.building?.name || 'Корпус гуртожитку'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #166534; vertical-align: middle;">Поверх:</td>
                        <td style="padding: 6px 0; font-weight: 800; color: #15803d; vertical-align: middle;">Поверх № ${booking.room?.floor || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #166534; vertical-align: middle;">Номер кімнати:</td>
                        <td style="padding: 6px 0; font-weight: 900; color: #047857; font-size: 15px; vertical-align: middle;">Кімната № ${booking.room?.room_number || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #166534; vertical-align: middle;">Статус поселення:</td>
                        <td style="padding: 6px 0; vertical-align: middle;">
                            <table style="border-collapse: collapse; display: inline-table; vertical-align: middle;">
                                <tr>
                                    <td style="background: #16a34a; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 6px; letter-spacing: 0.5px; text-align: center; vertical-align: middle; line-height: 1.2;">
                                        <span style="position: relative; top: -10px; display: inline-block;">ЗАТВЕРДЖЕНО ТА ДІЙСНО</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Блок QR-коду (швидкий вхід) та Печатка -->
            <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-top: 18px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
                    <!-- Ліва частина: QR-код для сканування та входу -->
                    <div style="display: flex; align-items: center; gap: 16px; width: 62%;">
                        ${
                            qrCodeDataUrl
                                ? `<div style="background: #ffffff; padding: 6px; border: 1.5px solid #10b981; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); flex-shrink: 0;">
                                    <img src="${qrCodeDataUrl}" style="width: 105px; height: 105px; display: block;" alt="QR Code" />
                                   </div>`
                                : ''
                        }
                        <div>
                            <div style="font-size: 11px; font-weight: 900; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                Електронний пропуск • Вхід за QR-кодом
                            </div>
                            <div style="font-size: 11px; color: #475569; line-height: 1.4; margin-bottom: 6px;">
                                Відскануйте камерою смартфона для швидкої перевірки особи на прохідній гуртожитку.
                            </div>
                            <div style="font-size: 11px; color: #047857; font-weight: 800; font-family: 'Courier New', monospace; background: #ecfdf5; padding: 3px 8px; border-radius: 6px; display: inline-block; border: 1px solid #a7f3d0;">
                                ${orderNumber}
                            </div>
                        </div>
                    </div>

                    <!-- Права частина: Електронна печатка МНАУ -->
                    <div style="width: 35%; text-align: center; border: 2px dashed #059669; padding: 12px; border-radius: 12px; background: #ffffff; box-sizing: border-box;">
                        <div style="font-size: 9px; font-weight: 800; color: #047857; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">
                            МНАУ • ВІДДІЛ ПОСЕЛЕННЯ
                        </div>
                        <div style="font-size: 11px; font-weight: 900; color: #065f46; letter-spacing: 0.5px;">
                            ЕЛЕКТРОННИЙ ПІДПИС
                        </div>
                        <div style="font-size: 9px; color: #16a34a; font-weight: 700; margin-top: 4px;">
                            Підтверджено в системі МНАУ
                        </div>
                        <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">
                            ${issueDate} р.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Футер та примітка -->
            <div style="text-align: center; margin-top: 18px; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px; line-height: 1.4;">
                <div>Цей електронний ордер є офіційною підставою для входу на територію гуртожитку та отримання ключів.</div>
                <div>Згенеровано автоматизованою системою поселення МНАУ • ${currentYear}</div>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: 794,
            windowWidth: 794,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`order-zaselennya-${orderNumber}.pdf`);
    } catch (err) {
        console.error('PDF generation error:', err);
        alert('Помилка під час генерації PDF-ордера. Спробуйте пізніше.');
    } finally {
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
};

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateOrderPdf = async ({ user, booking }) => {
    if (!booking || !user) return;

    const orderNumber = booking.order_number || 'ORD-2026-PENDING';
    const issueDate = new Date().toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    // Створюємо тимчасовий DOM-контейнер для стильного документа
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '794px'; // A4 пропорції при 96 DPI
    container.style.padding = '40px';
    container.style.boxSizing = 'border-box';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = "'Inter', 'Segoe UI', Arial, sans-serif";
    container.style.color = '#0f172a';

    container.innerHTML = `
        <div style="border: 3px double #059669; padding: 30px; border-radius: 12px; position: relative; background: #ffffff;">
            <!-- Водяний знак / Фоновий щит -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.03; font-size: 260px; font-weight: 900; color: #059669; pointer-events: none; user-select: none;">
                МНАУ
            </div>

            <!-- Шапка документа -->
            <div style="text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; tracking: 1.5px; color: #64748b; margin-bottom: 4px;">
                    Міністерство освіти і науки України
                </div>
                <div style="font-size: 16px; font-weight: 900; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                    Миколаївський Національний Аграрний Університет
                </div>
                <div style="font-size: 12px; font-weight: 600; color: #047857;">
                    Студентське містечко • Відділ поселення та обліку
                </div>
            </div>

            <!-- Заголовок Ордера -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: #ecfdf5; border: 1.5px solid #a7f3d0; color: #047857; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                    Офіційний електронний документ
                </div>
                <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; tracking: 1px;">
                    ОРДЕР НА ЗАСЕЛЕННЯ № ${orderNumber}
                </h1>
                <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-top: 6px;">
                    Дата видачі: ${issueDate} р.
                </div>
            </div>

            <!-- Блок студентської інформації -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #047857; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
                    👤 Відомості про студента / мешканця
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #64748b; width: 35%;">ПІБ студента:</td>
                        <td style="padding: 6px 0; font-weight: 800; color: #0f172a;">${user.name || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Електронна пошта:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${user.email || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Контактний телефон:</td>
                        <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${user.phone || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Напрям / Спеціальність:</td>
                        <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${user.specialty || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Курс та група:</td>
                        <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${user.course ? `${user.course} курс` : '-'} ${user.group ? `(Група ${user.group})` : ''}</td>
                    </tr>
                </table>
            </div>

            <!-- Блок місця проживання -->
            <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #15803d; margin-bottom: 12px; border-bottom: 1px solid #86efac; padding-bottom: 6px;">
                    🏠 Виділене місце проживання
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #166534; width: 35%;">Гуртожиток:</td>
                        <td style="padding: 6px 0; font-weight: 900; color: #14532d; font-size: 14px;">${booking.room?.building?.name || 'Корпус А'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #166534;">Поверх:</td>
                        <td style="padding: 6px 0; font-weight: 800; color: #15803d;">Поверх № ${booking.room?.floor || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #166534;">Номер кімнати:</td>
                        <td style="padding: 6px 0; font-weight: 900; color: #047857; font-size: 15px;">Кімната № ${booking.room?.room_number || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #166534;">Статус поселення:</td>
                        <td style="padding: 6px 0;">
                            <span style="background: #16a34a; color: #ffffff; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 6px;">
                                ЗАТВЕРДЖЕНО
                            </span>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Блок перевірки справжності та Печатка -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 20px; border-t: 1.5px dashed #cbd5e1;">
                <div style="width: 58%; font-size: 11px; color: #64748b; line-height: 1.5;">
                    <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; font-size: 10px; tracking: 0.5px;">
                        🔐 Перевірка автентичності документа:
                    </div>
                    Справжність цього ордера можна миттєво перевірити у коменданта або на веб-сайті університету за кодом:
                    <div style="font-family: monospace; font-size: 13px; font-weight: 900; color: #047857; margin-top: 4px; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; display: inline-block;">
                        ${orderNumber}
                    </div>
                </div>

                <!-- Печатка / Затвердження -->
                <div style="width: 38%; text-align: center; border: 2px dashed #059669; padding: 12px; border-radius: 12px; background: #fafaf9;">
                    <div style="font-size: 9px; font-weight: 800; color: #047857; text-transform: uppercase; margin-bottom: 4px;">
                        МНАУ • ВІДДІЛ ПОСЕЛЕННЯ
                    </div>
                    <div style="font-size: 11px; font-weight: 900; color: #065f46;">
                        ЕЛЕКТРОННИЙ ПІДПИС МІСТЕЧКА
                    </div>
                    <div style="font-size: 9px; color: #64748b; margin-top: 4px;">
                        Підтверджено в системі МНАУ
                    </div>
                </div>
            </div>

            <!-- Футер -->
            <div style="text-align: center; margin-top: 25px; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                Згенеровано автоматизованою системою поселення МНАУ • ${new Date().getFullYear()}
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

/**
 * Email Templates Module
 * Stores HTML email templates locally and generates them dynamically
 */

/**
 * Generate HTML for new member email
 */
export function generateNewMemberEmailHTML(data) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #8b1a1a 0%, #c41e3a 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .member-card { background: #f9f9f9; border-left: 4px solid #8b1a1a; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .member-header { display: flex; gap: 15px; margin-bottom: 15px; }
        .member-photo { width: 80px; height: 80px; border-radius: 8px; background: #e0e0e0; overflow: hidden; flex-shrink: 0; }
        .member-photo img { width: 100%; height: 100%; object-fit: cover; }
        .member-name { font-size: 18px; font-weight: 600; color: #2c1810; margin: 0 0 5px 0; }
        .member-chinese { font-size: 14px; color: #666; margin: 0 0 8px 0; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px; font-size: 13px; }
        .detail-row { display: flex; flex-direction: column; }
        .detail-label { font-weight: 600; color: #666; margin-bottom: 3px; }
        .detail-value { color: #333; }
        .action-info { background: #e8f4f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #2c3e50; }
        .action-info strong { color: #2c1810; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
        .footer a { color: #8b1a1a; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌳 李家有谱</h1>
            <p>新成员已添加 | New Member Added</p>
        </div>

        <div class="content">
            <p style="color: #2c3e50; margin: 15px 0;">亲爱的编辑者和管理员，</p>
            <p style="color: #2c3e50; margin: 15px 0;">一位新的家族成员已被添加到李家族谱中。以下是成员的详细信息：</p>

            <div class="member-card">
                <div class="member-header">
                    ${data.member_photo ? `<div class="member-photo"><img src="${data.member_photo}" alt="${data.member_name}"></div>` : ''}
                    <div>
                        <p class="member-name">${data.member_name}</p>
                        <p class="member-chinese">${data.member_chinese || '—'}</p>
                        <p style="margin: 5px 0; font-size: 13px; color: #666;">${data.member_gender || '—'}</p>
                    </div>
                </div>

                <div class="details">
                    <div class="detail-row">
                        <span class="detail-label">📅 出生日期</span>
                        <span class="detail-value">${data.member_birth || '—'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">世祖 (Generation)</span>
                        <span class="detail-value">${data.member_generation || '—'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">🏠 籍贯</span>
                        <span class="detail-value">${data.member_hometown || '—'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">🌍 国籍</span>
                        <span class="detail-value">${data.member_nationality || '—'}</span>
                    </div>
                </div>
            </div>

            <div class="action-info">
                <strong>✏️ 编辑者信息:</strong><br>
                编辑者: <strong>${data.editor_name}</strong><br>
                操作时间: ${data.timestamp}
            </div>

            <p style="color: #2c3e50; margin: 20px 0; font-size: 14px;">请登录李家有谱系统查看完整的家族树和更多详情。</p>
        </div>

        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                🌳 李家有谱 | Lee Family Genealogy<br>
                <a href="https://leefamily23.github.io/genealogy/">https://leefamily23.github.io/genealogy/</a>
            </p>
            <p style="margin: 0; color: #bbb;">这是一封自动生成的邮件，请勿直接回复。</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate HTML for death date update email
 */
export function generateDeathDateEmailHTML(data) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #5a4a42 0%, #8b6f47 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .member-card { background: #f9f9f9; border-left: 4px solid #5a4a42; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .member-header { display: flex; gap: 15px; margin-bottom: 15px; }
        .member-photo { width: 80px; height: 80px; border-radius: 8px; background: #e0e0e0; overflow: hidden; flex-shrink: 0; }
        .member-photo img { width: 100%; height: 100%; object-fit: cover; }
        .member-name { font-size: 18px; font-weight: 600; color: #2c1810; margin: 0 0 5px 0; }
        .member-chinese { font-size: 14px; color: #666; margin: 0 0 8px 0; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px; font-size: 13px; }
        .detail-row { display: flex; flex-direction: column; }
        .detail-label { font-weight: 600; color: #666; margin-bottom: 3px; }
        .detail-value { color: #333; }
        .death-notice { background: #fef5f5; border-left: 4px solid #c0392b; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: #2c3e50; }
        .death-notice strong { color: #c0392b; font-size: 15px; }
        .action-info { background: #e8f4f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #2c3e50; }
        .action-info strong { color: #2c1810; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
        .footer a { color: #5a4a42; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌳 李家有谱</h1>
            <p>成员讣告 | Member Passed Away</p>
        </div>

        <div class="content">
            <p style="color: #2c3e50; margin: 15px 0;">亲爱的编辑者和管理员，</p>
            <p style="color: #2c3e50; margin: 15px 0;">我们遗憾地通知您，一位家族成员已经去世。以下是成员的详细信息：</p>

            <div class="member-card">
                <div class="member-header">
                    ${data.member_photo ? `<div class="member-photo"><img src="${data.member_photo}" alt="${data.member_name}"></div>` : ''}
                    <div>
                        <p class="member-name">${data.member_name}</p>
                        <p class="member-chinese">${data.member_chinese || '—'}</p>
                    </div>
                </div>

                <div class="details">
                    <div class="detail-row">
                        <span class="detail-label">📅 出生日期</span>
                        <span class="detail-value">${data.member_birth || '—'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">⚰️ 去世日期</span>
                        <span class="detail-value" style="color: #c0392b; font-weight: 600;">${data.member_death || '—'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">🏠 籍贯</span>
                        <span class="detail-value">${data.member_hometown || '—'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">🌍 国籍</span>
                        <span class="detail-value">${data.member_nationality || '—'}</span>
                    </div>
                </div>
            </div>

            <div class="death-notice">
                <strong>⚰️ 讣告</strong><br>
                ${data.member_name} (${data.member_chinese || '—'}) 已于 ${data.member_death} 去世。<br>
                愿逝者安息。
            </div>

            <div class="action-info">
                <strong>✏️ 编辑者信息:</strong><br>
                编辑者: <strong>${data.editor_name}</strong><br>
                操作时间: ${data.timestamp}
            </div>

            <p style="color: #2c3e50; margin: 20px 0; font-size: 14px;">请登录李家有谱系统查看完整的家族树和更多详情。</p>
        </div>

        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                🌳 李家有谱 | Lee Family Genealogy<br>
                <a href="https://leefamily23.github.io/genealogy/">https://leefamily23.github.io/genealogy/</a>
            </p>
            <p style="margin: 0; color: #bbb;">这是一封自动生成的邮件，请勿直接回复。</p>
        </div>
    </div>
</body>
</html>`;
}

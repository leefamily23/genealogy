/**
 * Editor Guide System
 * Provides comprehensive guidelines for new editors
 */

/**
 * Open the editor guide modal
 */
export function openEditorGuide(role = null) {
  const modal = document.getElementById('editor-guide-modal');
  if (modal) {
    modal.classList.remove('hidden');
    loadGuideContent(role);
  }
}

/**
 * Close the editor guide modal
 */
export function closeEditorGuide() {
  const modal = document.getElementById('editor-guide-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Load guide content into the modal
 * @param {string} role - User role ('admin' or 'editor')
 */
function loadGuideContent(role) {
  const content = document.getElementById('guide-content');
  if (!content) return;

  const isAdmin = role === 'admin';

  content.innerHTML = `
    <div class="guide-section">
      <h2>📖 编辑者指南</h2>
      <p class="guide-intro">欢迎！本指南将帮助您了解如何编辑和管理李家族谱。</p>
    </div>

    <div class="guide-section">
      <h3>🔐 1. 编辑模式系统</h3>
      <div class="guide-content">
        <h4>什么是编辑模式？</h4>
        <p>为了防止多人同时编辑造成数据冲突，系统采用<strong>单人编辑模式</strong>。</p>
        
        <h4>如何进入编辑模式：</h4>
        <ol>
          <li>点击任何编辑按钮（添加、编辑、删除）</li>
          <li>系统会自动检查是否有其他编辑者正在编辑</li>
          <li>如果没有，您将进入编辑模式</li>
          <li>右上角会显示 <span class="highlight-orange">✏️ 编辑模式</span> 标识</li>
        </ol>

        <h4>⚠️ 重要提醒：</h4>
        <ul>
          <li><strong>编辑完成后必须点击 "完成编辑" 按钮</strong></li>
          <li>这样其他编辑者才能继续编辑</li>
          <li>如果忘记退出，系统会在 5 分钟后自动退出</li>
        </ul>

        <div class="guide-tip">
          💡 <strong>提示：</strong>如果看到"另一位编辑者正在编辑"的提示，请等待对方完成或等待 5 分钟自动超时。
        </div>
      </div>
    </div>

    <div class="guide-section">
      <h3>👤 2. 添加家族成员</h3>
      <div class="guide-content">
        <h4>添加子女：</h4>
        <ol>
          <li>点击父母的卡片查看详情</li>
          <li>点击 <button class="btn-demo">➕ 添加子女</button></li>
          <li>填写子女信息（姓名、性别、出生日期等）</li>
          <li>如果父母有配偶，可以选择配偶作为另一位家长</li>
          <li>点击 "保存" 完成添加</li>
        </ol>

        <h4>添加配偶：</h4>
        <ol>
          <li>点击成员卡片查看详情</li>
          <li>点击 <button class="btn-demo">💑 添加配偶</button></li>
          <li>填写配偶信息</li>
          <li>保存后配偶会显示在成员旁边</li>
        </ol>

        <h4>添加父母：</h4>
        <ol>
          <li>点击根节点成员（没有父母的成员）</li>
          <li>点击 <button class="btn-demo">⬆️ 添加父母</button></li>
          <li>填写父母信息</li>
        </ol>

        <div class="guide-tip">
          💡 <strong>提示：</strong>可以上传成员照片，支持 JPG、PNG 格式，建议大小不超过 2MB。
        </div>
      </div>
    </div>

    <div class="guide-section">
      <h3>✏️ 3. 编辑和删除成员</h3>
      <div class="guide-content">
        <h4>编辑成员信息：</h4>
        <ol>
          <li>点击成员卡片查看详情</li>
          <li>点击 <button class="btn-demo">✏️ 编辑</button></li>
          <li>修改需要更新的信息</li>
          <li>点击 "保存" 完成修改</li>
        </ol>

        <h4>删除成员：</h4>
        <ol>
          <li>点击成员卡片查看详情</li>
          <li>点击 <button class="btn-demo btn-danger">🗑️ 删除</button></li>
          <li>确认删除操作</li>
        </ol>

        <h4>⚠️ 删除规则：</h4>
        <ul>
          <li>只能删除<strong>没有子女</strong>的成员</li>
          <li>如果成员有配偶，配偶也会一起被删除</li>
          <li>删除前会显示警告信息</li>
          <li>删除操作<strong>无法撤销</strong>，请谨慎操作</li>
        </ul>
      </div>
    </div>

    <div class="guide-section">
      <h3>📸 4. 备份系统</h3>
      <div class="guide-content">
        <h4>什么是备份？</h4>
        <p>备份是家族树数据的完整备份，可以在数据出错时恢复到之前的状态。</p>

        <h4>创建备份：</h4>
        <ol>
          <li>点击顶部的 <button class="btn-demo">📥 备份</button> 按钮</li>
          <li>点击 <button class="btn-demo">📸 创建备份</button></li>
          <li>输入备份描述（可选）</li>
          <li>确认创建</li>
        </ol>

        <h4>恢复备份：</h4>
        <ol>
          <li>打开备份面板</li>
          <li>在"备份"中找到要恢复的备份</li>
          <li>点击 <button class="btn-demo btn-success">恢复</button> 按钮</li>
          <li>确认恢复操作</li>
          <li>页面会自动刷新并恢复到备份时的状态</li>
        </ol>

        <h4>📋 备份信息：</h4>
        <ul>
          <li>系统保留最近 <strong>15 个备份</strong></li>
          <li>每个备份显示：创建时间、成员数量、创建者</li>
        </ul>

        <div class="guide-warning">
          ⚠️ <strong>重要：</strong>恢复备份会覆盖当前所有数据，请确保在重要编辑前创建备份！
        </div>
      </div>
    </div>

    <div class="guide-section">
      <h3>🌳 5. 族谱视图切换</h3>
      <div class="guide-content">
        <h4>两种视图模式：</h4>
        <ul>
          <li><strong>📜 族谱 (李氏)：</strong>只显示标记为"李家族谱"的成员</li>
          <li><strong>🌳 家族树：</strong>显示所有家族成员，包括外姓配偶及其孩子们</li>
        </ul>

        <h4>切换视图：</h4>
        <p>点击顶部的标签按钮即可切换视图。</p>

        <h4>李家族谱标记：</h4>
        <p>在添加或编辑成员时，勾选 <strong>"李家族谱"</strong> 复选框，该成员就会在族谱视图中显示。</p>
      </div>
    </div>

    <div class="guide-section">
      <h3>🔍 6. 搜索和导航</h3>
      <div class="guide-content">
        <h4>搜索成员：</h4>
        <ol>
          <li>使用右下角的搜索框</li>
          <li>输入成员姓名</li>
          <li>点击搜索结果会自动定位到该成员</li>
        </ol>

        <h4>缩放和移动：</h4>
        <ul>
          <li><strong>放大：</strong>点击 <button class="btn-demo">＋</button> 或使用鼠标滚轮</li>
          <li><strong>缩小：</strong>点击 <button class="btn-demo">－</button> 或使用鼠标滚轮</li>
          <li><strong>重置：</strong>点击 <button class="btn-demo">⟳ 重置</button> 回到初始视图</li>
          <li><strong>拖动：</strong>按住鼠标左键拖动画布</li>
        </ul>
      </div>
    </div>

    <div class="guide-section">
      <h3>📷 7. 导出家族树图片</h3>
      <div class="guide-content">
        <h4>导出步骤：</h4>
        <ol>
          <li>调整视图到想要的位置和缩放级别</li>
          <li>点击 <button class="btn-demo">📷 导出图片</button></li>
          <li>图片会自动下载到您的设备</li>
        </ol>

        <h4>文件命名：</h4>
        <ul>
          <li>族谱视图：<code>族谱_YYYYMMDD_HHMMSS.png</code></li>
          <li>家族树视图：<code>家族树_YYYYMMDD_HHMMSS.png</code></li>
        </ul>

        <div class="guide-tip">
          💡 <strong>提示：</strong>导出的图片是高分辨率的，适合打印和分享。
        </div>
      </div>
    </div>

    <div class="guide-section">
      <h3>📝 8. 编辑历史记录</h3>
      <div class="guide-content">
        <h4>查看编辑历史：</h4>
        <ol>
          <li>点击左侧边栏的 <button class="btn-demo">📜 历史</button> 按钮</li>
          <li>查看最近 20 条编辑记录</li>
          <li>每条记录显示：操作类型、操作者、时间</li>
        </ol>

        <h4>记录的操作类型：</h4>
        <ul>
          <li>➕ 添加成员</li>
          <li>✏️ 编辑成员</li>
          <li>🗑️ 删除成员</li>
          <li>👥 用户管理操作</li>
        </ul>
      </div>
    </div>

    <div class="guide-section">
      <h3>❓ 9. 常见问题</h3>
      <div class="guide-content">
        <h4>Q: 为什么我无法编辑？</h4>
        <p>A: 可能是另一位编辑者正在编辑模式中。请等待 5 分钟或联系管理员强制终止会话。</p>

        <h4>Q: 如何上传成员照片？</h4>
        <p>A: 在添加或编辑成员时，点击"选择照片"按钮，选择图片文件即可。</p>

        <h4>Q: 删除成员后可以恢复吗？</h4>
        <p>A: 删除操作无法直接撤销，但可以通过恢复之前的备份来恢复数据。建议在重要操作前创建备份。</p>

        <h4>Q: 备份会占用很多空间吗？</h4>
        <p>A: 系统只保留最近 15 个备份，旧备份会自动删除，不会占用过多空间。</p>

        <h4>Q: 手机上可以编辑吗？</h4>
        <p>A: 可以！系统支持手机浏览器，所有功能都可以在手机上使用。</p>
      </div>
    </div>

    <div class="guide-section">
      <h3>💡 10. 最佳实践建议</h3>
      <div class="guide-content">
        <ul>
          <li>✅ <strong>编辑前创建备份</strong> - 重要编辑前先备份</li>
          <li>✅ <strong>及时退出编辑模式</strong> - 完成后点击"完成编辑"</li>
          <li>✅ <strong>填写完整信息</strong> - 尽量填写详细的成员信息</li>
          <li>✅ <strong>使用高质量照片</strong> - 上传清晰的成员照片</li>
          <li>✅ <strong>定期检查历史记录</strong> - 了解最近的编辑情况</li>
          <li>✅ <strong>谨慎删除操作</strong> - 删除前再次确认</li>
          <li>✅ <strong>协调编辑时间</strong> - 与其他编辑者沟通避免冲突</li>
        </ul>
      </div>
    </div>

    ${isAdmin ? `
    <div class="guide-section admin-only-section" style="background: #fff8f0; border: 2px solid #8b1a1a; border-radius: 8px; padding: 20px;">
      <h3>👑 11. 管理员专属功能</h3>
      <div class="guide-content">
        <p style="color: #8b1a1a; font-weight: 600; margin-bottom: 12px;">⚠️ 以下功能仅限管理员使用</p>
        
        <h4>👥 用户管理</h4>
        <p>点击顶部的 <button class="btn-demo">👥 管理用户</button> 按钮打开用户管理面板。</p>
        
        <h4>邀请新编辑者：</h4>
        <ol>
          <li>在"Invite by email address"输入框中输入用户的 Gmail 地址</li>
          <li>点击 <button class="btn-demo">Invite as Editor</button></li>
          <li>用户将收到邀请邮件</li>
          <li>用户首次登录后会自动获得编辑权限</li>
        </ol>
        
        <h4>管理现有用户：</h4>
        <ul>
          <li><strong>提升为管理员：</strong>点击用户旁边的 <button class="btn-demo" style="background: #8b1a1a; color: white;">Promote</button> 按钮</li>
          <li><strong>降级为编辑者：</strong>点击管理员旁边的 <button class="btn-demo" style="background: #e67e22; color: white;">Demote</button> 按钮</li>
          <li><strong>移除用户：</strong>点击 <button class="btn-demo btn-danger">Remove</button> 按钮（⚠️ 无法撤销）</li>
        </ul>
        
        <div class="guide-warning">
          ⚠️ <strong>注意：</strong>移除用户后，该用户将无法再访问家族树。请谨慎操作！
        </div>
        
        <h4>🚨 强制终止编辑Session</h4>
        <p>如果编辑者忘记退出编辑模式，导致其他人无法编辑：</p>
        <ol>
          <li>打开 <button class="btn-demo">👥 管理用户</button> 面板</li>
          <li>滚动到底部的"编辑管理"部分</li>
          <li>点击 <button class="btn-demo" style="background: #8e44ad; color: white;">🚨 强制终止</button></li>
          <li>确认操作后，当前编辑会话将被强制终止</li>
          <li>其他编辑者即可立即进入编辑模式</li>
        </ol>
        
        <div class="guide-tip">
          💡 <strong>提示：</strong>系统会在 5 分钟无活动后自动终止编辑会话，通常不需要手动终止。
        </div>
        
        <h4>🔄 重置浏览次数</h4>
        <p>如需重置网站浏览次数统计：</p>
        <ol>
          <li>打开 <button class="btn-demo">📥 备份</button> 面板</li>
          <li>滚动到底部的"重置统计"部分</li>
          <li>点击 <button class="btn-demo" style="background: #c0392b; color: white;">🔄 重置浏览次数</button></li>
          <li>确认操作后，浏览次数将重置为 0</li>
        </ol>
        
        <div class="guide-warning">
          ⚠️ <strong>警告：</strong>重置浏览次数操作无法撤销！
        </div>
        
        <h4>📧 邮件通知系统</h4>
        <p>管理员可以启用邮件通知功能，在以下情况下自动发送邮件给所有编辑者和管理员：</p>
        <ul>
          <li>✉️ <strong>新成员添加：</strong>当有人添加新的家族成员时</li>
          <li>✉️ <strong>去世日期更新：</strong>当为成员添加去世日期时</li>
        </ul>
        
        <h4>启用邮件通知：</h4>
        <ol>
          <li>打开 <button class="btn-demo">👥 管理用户</button> 面板</li>
          <li>滚动到底部的"📧 邮件通知"部分</li>
          <li>勾选 <strong>"启用"</strong> 复选框</li>
          <li>状态会显示 <span style="color: #27ae60; font-weight: 600;">✅ 已启用</span></li>
        </ol>
        
        <h4>邮件内容：</h4>
        <p>邮件会包含以下信息：</p>
        <ul>
          <li>成员的中文名和英文名</li>
          <li>成员的出生日期、去世日期（如有）</li>
          <li>成员的籍贯和国籍</li>
          <li>成员的照片</li>
          <li>操作者的名字和操作时间</li>
        </ul>
        
        <div class="guide-tip">
          💡 <strong>提示：</strong>邮件会发送给所有状态为"active"的编辑者和管理员。建议在重要编辑前启用此功能，以便及时通知团队成员。
        </div>
        
        <div class="guide-warning">
          ⚠️ <strong>注意：</strong>邮件通知使用 EmailJS 服务，有配额限制。请勿频繁启用/禁用，以免浪费配额。建议在需要时启用，完成编辑后再禁用。
        </div>
        
        <h4>📊 管理员最佳实践</h4>
        <ul>
          <li>✅ <strong>定期检查用户列表</strong> - 确保只有授权用户有访问权限</li>
          <li>✅ <strong>谨慎提升管理员</strong> - 管理员拥有所有权限，包括删除用户</li>
          <li>✅ <strong>监控编辑会话</strong> - 如有编辑者长时间占用，及时沟通或终止</li>
          <li>✅ <strong>定期创建备份</strong> - 在重要编辑前后创建备份</li>
          <li>✅ <strong>查看编辑历史</strong> - 了解谁在何时做了什么修改</li>
          <li>✅ <strong>协调编辑时间</strong> - 与编辑者沟通，避免编辑冲突</li>
          <li>✅ <strong>合理使用邮件通知</strong> - 在需要时启用，避免浪费 EmailJS 配额</li>
        </ul>
        
        <h4>🔐 权限说明</h4>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">功能</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">编辑者</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">管理员</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">查看家族树</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">添加/编辑/删除成员</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">创建/恢复备份</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">查看编辑历史</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
            </tr>
            <tr style="background: #fff8f0;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>管理用户</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">❌</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
            </tr>
            <tr style="background: #fff8f0;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>强制终止编辑Session</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">❌</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
            </tr>
            <tr style="background: #fff8f0;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>重置浏览次数</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">❌</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
            </tr>
            <tr style="background: #fff8f0;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>启用/禁用邮件通知</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">❌</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <div class="guide-section" style="background: #f0f4ff; border: 1.5px solid #3498db; border-radius: 8px; padding: 20px;">
      <h3>⚙️ ${isAdmin ? '12' : '11'}. 系统技术说明</h3>
      <div class="guide-content">
        <p style="color: #555; margin-bottom: 16px;">以下是本网站所使用的技术系统，了解它们有助于理解数据如何存储与运作。</p>

        <div style="display: flex; flex-direction: column; gap: 14px;">

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">🔥</span>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: nowrap;"><div style="display: flex; align-items: center; gap: 6px;"><strong style="color: #2c1810;">Firebase Firestore</strong><a href="https://firebase.google.com/docs/firestore" target="_blank" style="font-size: 0.75rem; color: #3498db;">firebase.google.com</a></div>
                ${isAdmin ? `<a href="https://console.firebase.google.com/u/4/project/leefamilygenealogy/firestore/databases/-default-/data/~2F" target="_blank" style="font-size: 0.75rem; background: #f57c00; color: white; padding: 2px 8px; border-radius: 4px; text-decoration: none; flex-shrink: 0;">🔥 Console</a>` : ''}
              </div>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">云端数据库，存储所有家族成员资料、用户账号、编辑历史记录及备份。所有数据实时同步，任何设备打开网页都能看到最新内容。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">🔐</span>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: nowrap;"><div style="display: flex; align-items: center; gap: 6px;"><strong style="color: #2c1810;">Firebase Authentication</strong><a href="https://firebase.google.com/docs/auth" target="_blank" style="font-size: 0.75rem; color: #3498db;">firebase.google.com</a></div>
                ${isAdmin ? `<a href="https://console.firebase.google.com/u/4/project/leefamilygenealogy/authentication/users" target="_blank" style="font-size: 0.75rem; background: #f57c00; color: white; padding: 2px 8px; border-radius: 4px; text-decoration: none; flex-shrink: 0;">🔥 Console</a>` : ''}
              </div>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">负责用户登录验证，使用 Google 账号登录。系统会核对登录者是否在授权名单内，并根据角色（编辑者 / 管理员）开放对应功能。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">🖼️</span>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: nowrap;"><div style="display: flex; align-items: center; gap: 6px;"><strong style="color: #2c1810;">成员照片 (Base64 in Firestore)</strong></div>
                ${isAdmin ? `<a href="https://console.firebase.google.com/u/4/project/leefamilygenealogy/firestore/databases/-default-/data/~2Ffamily" target="_blank" style="font-size: 0.75rem; background: #f57c00; color: white; padding: 2px 8px; border-radius: 4px; text-decoration: none; flex-shrink: 0;">🔥 Console</a>` : ''}
              </div>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">照片并非存储在 Firebase Storage，而是以 <code style="background:#f0f0f0; padding: 1px 4px; border-radius: 3px;">Base64</code> 字符串格式直接存入 Firestore 的 <code style="background:#f0f0f0; padding: 1px 4px; border-radius: 3px;">family</code> 集合中，作为每位成员文档的 <code style="background:#f0f0f0; padding: 1px 4px; border-radius: 3px;">imageURL</code> 字段。上传前会自动压缩至 400×400px。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">🔒</span>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: nowrap;"><div style="display: flex; align-items: center; gap: 6px;"><strong style="color: #2c1810;">Firestore Security Rules</strong><a href="https://firebase.google.com/docs/firestore/security/get-started" target="_blank" style="font-size: 0.75rem; color: #3498db;">firebase.google.com</a></div>
                ${isAdmin ? `<a href="https://console.firebase.google.com/u/4/project/leefamilygenealogy/firestore/databases/-default-/security/rules" target="_blank" style="font-size: 0.75rem; background: #f57c00; color: white; padding: 2px 8px; border-radius: 4px; text-decoration: none; flex-shrink: 0;">🔥 Console</a>` : ''}
              </div>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">数据库安全规则，在服务器端控制读写权限。确保只有已登录且经授权的用户才能修改数据，防止未授权访问或未授权篡改。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">📧</span>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: nowrap;"><div style="display: flex; align-items: center; gap: 6px;"><strong style="color: #2c1810;">EmailJS 邮件通知</strong><a href="https://www.emailjs.com" target="_blank" style="font-size: 0.75rem; color: #3498db;">emailjs.com</a></div>
                ${isAdmin ? `<a href="https://dashboard.emailjs.com/admin/templates" target="_blank" style="font-size: 0.75rem; background: #2196f3; color: white; padding: 2px 8px; border-radius: 4px; text-decoration: none; flex-shrink: 0;">📧 Dashboard</a>` : ''}
              </div>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">邮件发送服务。当启用邮件通知时，系统会在以下情况自动发送邮件给所有编辑者和管理员：(1) 添加新成员时，(2) 为成员添加去世日期时。邮件包含成员信息、照片和操作者名字。管理员可在用户管理面板中启用/禁用此功能。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">🌐</span>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: nowrap;"><div style="display: flex; align-items: center; gap: 6px;"><strong style="color: #2c1810;">GitHub Pages</strong><a href="https://pages.github.com" target="_blank" style="font-size: 0.75rem; color: #3498db;">pages.github.com</a></div>
                ${isAdmin ? `<a href="https://github.com/leefamily23/genealogy" target="_blank" style="font-size: 0.75rem; background: #24292e; color: white; padding: 2px 8px; border-radius: 4px; text-decoration: none; flex-shrink: 0;">🐙 GitHub</a>` : ''}
              </div>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">网站托管服务，将网页部署到公开网址供所有人访问。每次推送代码到 GitHub 主分支后，网站会自动更新。支持 HTTPS 安全连接，确保数据传输加密。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">📊</span>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: nowrap;"><div style="display: flex; align-items: center; gap: 6px;"><strong style="color: #2c1810;">D3.js</strong><a href="https://d3js.org" target="_blank" style="font-size: 0.75rem; color: #3498db;">d3js.org</a></div>
              </div>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">数据可视化库，负责将家族成员数据渲染成可交互的树状图。支持缩放、拖动、点击查看详情等操作，并可导出为图片。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">✏️</span>
            <div>
              <strong style="color: #2c1810;">单人编辑锁定系统</strong>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">防止多人同时编辑造成数据冲突。每次只允许一位编辑者进入编辑模式，系统通过 Firestore 实时追踪编辑状态，并以心跳机制（每 30 秒）确认编辑者仍在线，5 分钟无操作自动释放锁定。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">📸</span>
            <div>
              <strong style="color: #2c1810;">备份系统</strong>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">手动创建家族树完整数据备份，存储于 Firestore。系统保留最近 15 个备份，超出时自动删除最旧的。可随时一键恢复至任意备份状态，防止误操作导致数据丢失。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">📋</span>
            <div>
              <strong style="color: #2c1810;">编辑历史记录</strong>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">每次添加、编辑、删除成员或管理用户时，系统自动记录操作者、操作内容及时间，显示在左侧边栏。方便追踪谁在何时做了什么修改。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">🖼️</span>
            <div>
              <strong style="color: #2c1810;">成员照片上传</strong>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">支持为每位成员上传照片（JPG / PNG / WebP，最大 5MB）。照片会自动压缩至 400×400px 后以 Base64 格式直接存入 Firestore 的 family 集合，点击照片可全屏查看。Firebase Storage 未使用。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">📑</span>
            <div>
              <strong style="color: #2c1810;">双视图切换（族谱 / 家族树）</strong>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">族谱视图只显示标记为"李家族谱"的成员；家族树视图显示所有成员（含配偶）。两种视图均可独立导出为图片。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">👁️</span>
            <div>
              <strong style="color: #2c1810;">页面浏览次数统计</strong>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">每次有人打开网页时自动累计浏览次数，数据存于 Firestore，显示在页面右上角。管理员可在用户管理面板中将计数重置为 0。</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dde;">
            <span style="font-size: 1.5rem; flex-shrink: 0;">🔗</span>
            <div>
              <strong style="color: #2c1810;">GitHub API 版本追踪</strong>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #555;">页面加载时自动从 GitHub API 获取最新 commit 信息，显示在右上角版本号旁。点击 commit 编号可查看完整提交详情，方便确认当前运行的是最新版本。</p>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="guide-section guide-footer">
      <p>如有任何问题或需要帮助，请联系管理员。</p>
      <p><strong>祝您使用愉快！🎉</strong></p>
    </div>
  `;
}

/**
 * Initialize editor guide
 */
export function initEditorGuide() {
  const closeBtn = document.getElementById('editor-guide-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeEditorGuide);
  }
  
  // Close when clicking on overlay (outside modal content)
  const modal = document.getElementById('editor-guide-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      // Only close if clicking directly on the overlay, not the modal content
      if (e.target === modal) {
        closeEditorGuide();
      }
    });
  }
}

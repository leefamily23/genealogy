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
      <h3>📸 4. 快照备份系统</h3>
      <div class="guide-content">
        <h4>什么是快照？</h4>
        <p>快照是家族树数据的完整备份，可以在数据出错时恢复到之前的状态。</p>

        <h4>创建快照：</h4>
        <ol>
          <li>点击顶部的 <button class="btn-demo">📥 备份</button> 按钮</li>
          <li>点击 <button class="btn-demo">📸 创建快照</button></li>
          <li>输入快照描述（可选）</li>
          <li>确认创建</li>
        </ol>

        <h4>恢复快照：</h4>
        <ol>
          <li>打开备份面板</li>
          <li>在"快照历史"中找到要恢复的快照</li>
          <li>点击 <button class="btn-demo btn-success">恢复</button> 按钮</li>
          <li>确认恢复操作</li>
          <li>页面会自动刷新并恢复到快照时的状态</li>
        </ol>

        <h4>📋 快照信息：</h4>
        <ul>
          <li>系统保留最近 <strong>15 个快照</strong></li>
          <li>每个快照显示：创建时间、成员数量、创建者</li>
          <li>恢复前会自动创建当前状态的快照</li>
        </ul>

        <div class="guide-warning">
          ⚠️ <strong>重要：</strong>恢复快照会覆盖当前所有数据，请确保在重要编辑前创建快照！
        </div>
      </div>
    </div>

    <div class="guide-section">
      <h3>🌳 5. 族谱视图切换</h3>
      <div class="guide-content">
        <h4>两种视图模式：</h4>
        <ul>
          <li><strong>📜 族谱 (李氏)：</strong>只显示标记为"李家族谱"的成员</li>
          <li><strong>🌳 家族树：</strong>显示所有家族成员，包括配偶</li>
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
        <p>A: 删除操作无法直接撤销，但可以通过恢复之前的快照来恢复数据。建议在重要操作前创建快照。</p>

        <h4>Q: 快照会占用很多空间吗？</h4>
        <p>A: 系统只保留最近 15 个快照，旧快照会自动删除，不会占用过多空间。</p>

        <h4>Q: 手机上可以编辑吗？</h4>
        <p>A: 可以！系统支持手机浏览器，所有功能都可以在手机上使用。</p>
      </div>
    </div>

    <div class="guide-section">
      <h3>💡 10. 最佳实践建议</h3>
      <div class="guide-content">
        <ul>
          <li>✅ <strong>编辑前创建快照</strong> - 重要编辑前先备份</li>
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
        
        <h4>🚨 强制终止编辑会话</h4>
        <p>如果编辑者忘记退出编辑模式，导致其他人无法编辑：</p>
        <ol>
          <li>打开 <button class="btn-demo">👥 管理用户</button> 面板</li>
          <li>滚动到底部的"编辑管理"部分</li>
          <li>点击 <button class="btn-demo" style="background: #8e44ad; color: white;">🚨 终止编辑会话</button></li>
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
        
        <h4>📊 管理员最佳实践</h4>
        <ul>
          <li>✅ <strong>定期检查用户列表</strong> - 确保只有授权用户有访问权限</li>
          <li>✅ <strong>谨慎提升管理员</strong> - 管理员拥有所有权限，包括删除用户</li>
          <li>✅ <strong>监控编辑会话</strong> - 如有编辑者长时间占用，及时沟通或终止</li>
          <li>✅ <strong>定期创建快照</strong> - 在重要编辑前后创建备份</li>
          <li>✅ <strong>查看编辑历史</strong> - 了解谁在何时做了什么修改</li>
          <li>✅ <strong>协调编辑时间</strong> - 与编辑者沟通，避免编辑冲突</li>
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
              <td style="padding: 8px; border: 1px solid #ddd;">创建/恢复快照</td>
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
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>强制终止编辑会话</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">❌</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
            </tr>
            <tr style="background: #fff8f0;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>重置浏览次数</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">❌</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">✅</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

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

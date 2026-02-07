#!/usr/bin/env node
/**
 * 小红书发布脚本 - 使用 redbook-mcp
 */

import { RedbookPoster } from '/Users/bian/.claude/mcp-servers/redbook-mcp/redbook-poster.js';
import fs from 'fs';
import path from 'path';

const jsonPath = '/Users/bian/.claude/mcp-servers/redbook-data';


function extractFromOutline(outlinePath) {
  const content = fs.readFileSync(outlinePath, 'utf-8');
  let mainContent = content;
  if (content.startsWith('---')) {
    const parts = content.split('---\n');
    if (parts.length >= 3) {
      mainContent = parts.slice(2).join('---\n');
    }
  }

  const titleMatch = mainContent.match(/##\s+P1\s+(?:封面|Cover).*?\*\*Hook\*\*:\s*["'](.+?)["']/);
  let title = titleMatch ? titleMatch[1].trim() : '小红书笔记';
  title = title.substring(0, 20);

  const xhsContent = [];
  const pageRegex = /##\s+P\d+.*?\n(.*?)(?=##\s+P|\Z)/gs;
  let match;
  while ((match = pageRegex.exec(mainContent)) !== null) {
    const pageContent = match[1];
    const msgMatch = pageContent.match(/\*\*Message\*\*:\s*(.+?)(?=\n\s*\*\*|\Z)/s);
    if (msgMatch) {
      let msg = msgMatch[1].trim().replace(/\*\*/g, '');
      if (msg && !xhsContent.includes(msg)) {
        xhsContent.push(msg);
      }
    }
  }

  let fullContent = xhsContent.length > 0 ? xhsContent.join('\n\n') : mainContent.substring(0, 500);
  fullContent = fullContent.substring(0, 1000);

  return { title, content: fullContent };
}


function extractFromPost(postPath) {
  const content = fs.readFileSync(postPath, 'utf-8');
  const lines = content.trim().split('\n');

  // 第一行作为标题
  let title = lines[0].trim().substring(0, 20);
  if (title.length === 0) {
    title = '小红书笔记';
  }

  // 其余作为内容
  let postContent = content.trim();
  // 限制内容长度
  if (postContent.length > 1000) {
    postContent = postContent.substring(0, 1000);
  }

  return { title, content: postContent };
}


function findImages(sessionDir) {
  const files = fs.readdirSync(sessionDir)
    .filter(f => f.endsWith('.png'))
    .filter(f => !f.toLowerCase().includes('preview') && !f.toLowerCase().includes('backup'))
    .sort();
  return files.map(f => path.join(sessionDir, f));
}


export async function publishToXiaohongshu(sessionDir, previewMode = false) {
  const poster = new RedbookPoster(jsonPath);

  try {
    console.log('🚀 启动发布流程...\n');

    if (!fs.existsSync(sessionDir)) {
      throw new Error('目录不存在: ' + sessionDir);
    }

    // 优先使用 post.md，如果不存在则使用 outline.md
    const postFile = path.join(sessionDir, 'post.md');
    const outlineFile = path.join(sessionDir, 'outline.md');

    let title, content;
    if (fs.existsSync(postFile)) {
      console.log('✓ 找到 post.md');
      const result = extractFromPost(postFile);
      title = result.title;
      content = result.content;
    } else if (fs.existsSync(outlineFile)) {
      console.log('✓ 找到 outline.md');
      const result = extractFromOutline(outlineFile);
      title = result.title;
      content = result.content;
    } else {
      throw new Error('找不到 post.md 或 outline.md');
    }

    // 找到所有 png 图片
    const images = findImages(sessionDir);
    if (images.length === 0) {
      throw new Error('没有找到图片: ' + sessionDir);
    }

    // 上传所有图片，不限制数量
    console.log('📝 准备发布:');
    console.log('  标题: ' + title);
    console.log('  内容: ' + content.length + ' 字');
    console.log('  图片: ' + images.length + ' 张\n');

    if (previewMode) {
      console.log('👀 [预览模式] 未实际发布\n');
      console.log('图片列表:');
      images.forEach((img, i) => {
        console.log('  ' + (i + 1) + '. ' + path.basename(img));
      });
      return { success: true, preview: true };
    }

    console.log('🔐 登录中...');
    await poster.login('', '');

    console.log('📤 发布中...');
    await poster.postArticle(title, content, images);

    console.log('\n✅ 发布流程完成！');
    console.log('  标题: ' + title);
    console.log('  图片: ' + images.length + ' 张\n');

    console.log('⏳ 浏览器将保持打开 30 秒，请确认发布结果...');
    console.log('💡 提示：如果看到错误提示，请截图记录\n');
    await poster.page.waitForTimeout(30000);

    await poster.close();

    return { success: true };
  } catch (err) {
    console.error('\n❌ 发布失败: ' + err.message);
    await poster.close();
    return { success: false, error: err.message };
  }
}


// CLI 入口
const args = process.argv.slice(2);
if (args.length >= 1) {
  const sessionDir = args[0].replace(/^~/, process.env.HOME);
  const previewMode = args.includes('--preview');

  publishToXiaohongshu(sessionDir, previewMode).then(result => {
    process.exit(result.success ? 0 : 1);
  });
} else {
  console.log('用法:');
  console.log('  node publish_with_mcp.js ~/Myxhs/ai-tools');
  console.log('  node publish_with_mcp.js ~/Myxhs/ai-tools --preview');
  process.exit(1);
}

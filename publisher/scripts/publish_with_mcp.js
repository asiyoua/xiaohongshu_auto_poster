#!/usr/bin/env node
/**
 * 小红书发布脚本 - 使用 redbook-mcp
 *
 * 用法:
 *   node publish_with_mcp.js <session-dir> [options]
 *
 * 参数:
 *   session-dir    包含 post.md 或 outline.md 的目录
 *
 * 选项:
 *   --preview      预览模式，不实际发布
 *   --mcp-server   MCP 服务器目录（默认: ~/.claude/mcp-servers/redbook-mcp）
 *   --data-dir     数据目录（默认: ~/.claude/mcp-servers/redbook-data）
 *
 * 环境变量:
 *   REDBOOK_MCP_SERVER    MCP 服务器目录
 *   REDBOOK_DATA_DIR      数据目录
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 解析命令行参数
function parseArgs(args) {
  const params = {
    sessionDir: null,
    previewMode: false,
    mcpServer: null,
    dataDir: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--preview':
        params.previewMode = true;
        break;
      case '--mcp-server':
        params.mcpServer = args[++i];
        break;
      case '--data-dir':
        params.dataDir = args[++i];
        break;
      default:
        if (!arg.startsWith('--')) {
          params.sessionDir = arg;
        }
        break;
    }
  }

  return params;
}

// 获取配置路径（优先级：命令行参数 > 环境变量 > 默认值）
function getConfigPaths(params) {
  const home = process.env.HOME;

  // MCP 服务器路径
  const mcpServer = params.mcpServer
    || process.env.REDBOOK_MCP_SERVER
    || path.join(home, '.claude/mcp-servers/redbook-mcp');

  // 数据目录路径
  const dataDir = params.dataDir
    || process.env.REDBOOK_DATA_DIR
    || path.join(home, '.claude/mcp-servers/redbook-data');

  return { mcpServer, dataDir };
}

// 动态导入 RedbookPoster
async function getRedbookPoster(mcpServer) {
  const posterPath = path.join(mcpServer, 'redbook-poster.js');

  if (!fs.existsSync(posterPath)) {
    throw new Error(`找不到 RedbookPoster: ${posterPath}\n请确保 MCP 服务器已安装，或使用 --mcp-server 参数指定路径`);
  }

  const module = await import(posterPath);
  return module.RedbookPoster;
}


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


export async function publishToXiaohongshu(sessionDir, previewMode = false, mcpServer = null, dataDir = null) {
  // 使用传入的参数或默认配置
  const config = mcpServer || dataDir
    ? { mcpServer: mcpServer || path.join(process.env.HOME, '.claude/mcp-servers/redbook-mcp'),
        dataDir: dataDir || path.join(process.env.HOME, '.claude/mcp-servers/redbook-data') }
    : getConfigPaths({});

  const RedbookPoster = await getRedbookPoster(config.mcpServer);
  const poster = new RedbookPoster(config.dataDir);

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
const params = parseArgs(args);

if (params.sessionDir) {
  const sessionDir = params.sessionDir.replace(/^~/, process.env.HOME);
  const config = getConfigPaths(params);

  console.log('配置:');
  console.log(`  MCP 服务器: ${config.mcpServer}`);
  console.log(`  数据目录: ${config.dataDir}`);
  console.log(`  会话目录: ${sessionDir}`);
  console.log(`  预览模式: ${params.previewMode ? '是' : '否'}\n`);

  publishToXiaohongshu(sessionDir, params.previewMode, config.mcpServer, config.dataDir).then(result => {
    process.exit(result.success ? 0 : 1);
  });
} else {
  console.log('用法:');
  console.log('  node publish_with_mcp.js <session-dir> [options]\n');
  console.log('参数:');
  console.log('  session-dir    包含 post.md 或 outline.md 的目录\n');
  console.log('选项:');
  console.log('  --preview      预览模式，不实际发布');
  console.log('  --mcp-server   MCP 服务器目录');
  console.log('  --data-dir     数据目录\n');
  console.log('环境变量:');
  console.log('  REDBOOK_MCP_SERVER    MCP 服务器目录');
  console.log('  REDBOOK_DATA_DIR      数据目录\n');
  console.log('示例:');
  console.log('  node publish_with_mcp.js ~/Myxhs/ai-tools');
  console.log('  node publish_with_mcp.js ~/Myxhs/ai-tools --preview');
  console.log('  REDBOOK_MCP_SERVER=/custom/path node publish_with_mcp.js ~/Myxhs/ai-tools');
  console.log('  node publish_with_mcp.js ~/Myxhs/ai-tools --mcp-server /custom/mcp\n');
  process.exit(1);
}

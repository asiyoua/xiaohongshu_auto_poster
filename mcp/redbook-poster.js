/**
 * 小红书自动发稿服务 - 拟人化增强版
 *
 * 增强功能：
 * - 随机延迟模拟人类操作节奏
 * - 人类打字速度模拟
 * - 鼠标移动轨迹
 * - 自然滚动行为
 * - 更真实的浏览器指纹
 */
import { chromium } from 'playwright';
import fs from "fs";
import path from "path";

export class RedbookPoster {
  constructor(jsonPath = "/tmp") {
    this.cookiesFile = path.join(jsonPath, "redbook_cookies.json");
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  // ========== 拟人化工具函数 ==========

  /**
   * 随机延迟 (min-ms 到 max-ms 之间)
   */
  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.page.waitForTimeout(delay);
  }

  /**
   * 人类打字速度模拟 (逐字输入 + 随机延迟)
   */
  async humanType(element, text) {
    await element.click();
    await this.randomDelay(300, 800); // 点击后停顿

    // 清空现有内容
    await element.fill('');
    await this.randomDelay(100, 300);

    // 逐字输入
    for (let i = 0; i < text.length; i++) {
      await element.type(text[i]);

      // 每个字符间随机延迟，模拟真实打字速度
      // 中文字符通常输入更快，英文标点稍慢
      const baseDelay = text[i].match(/[\u4e00-\u9fa5]/) ? 80 : 120;
      const delay = baseDelay + Math.random() * 100;

      // 10%概率停顿更久（模拟思考）
      if (Math.random() < 0.1) {
        await this.page.waitForTimeout(400 + Math.random() * 600);
      } else {
        await this.page.waitForTimeout(delay);
      }

      // 偶尔删除重打（模拟纠错）- 仅在较长文本时
      if (text.length > 10 && Math.random() < 0.02 && i > 2) {
        await this.page.keyboard.press('Backspace');
        await this.randomDelay(200, 400);
        await element.type(text[i]);
      }
    }

    // 输入完成后短暂停顿
    await this.randomDelay(500, 1000);
  }

  /**
   * 人类点击（带鼠标移动轨迹）
   */
  async humanClick(element) {
    const box = await element.boundingBox();
    if (!box) {
      await element.click();
      return;
    }

    // 计算随机偏移位置（不会每次都点在正中心）
    const offsetX = (Math.random() - 0.5) * 20; // ±10px
    const offsetY = (Math.random() - 0.5) * 10; // ±5px
    const x = box.x + box.width / 2 + offsetX;
    const y = box.y + box.height / 2 + offsetY;

    // 模拟鼠标移动轨迹
    const steps = 10 + Math.floor(Math.random() * 15); // 10-25步
    await this.page.mouse.move(x, y, { steps });
    await this.randomDelay(80, 200); // 到达后短暂停顿
    await this.page.mouse.click(x, y);
    await this.randomDelay(200, 500); // 点击后停顿
  }

  /**
   * 自然滚动行为（模拟浏览内容）
   */
  async naturalScrolling() {
    // 随机滚动 1-3 次
    const scrollCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < scrollCount; i++) {
      // 每次滚动的距离
      const distance = 100 + Math.random() * 300;

      await this.page.evaluate((dist) => {
        window.scrollBy({
          top: dist,
          behavior: 'smooth' // 平滑滚动
        });
      }, distance);

      // 滚动后停顿，模拟阅读时间
      await this.randomDelay(800, 2000);
    }

    // 滚回顶部
    await this.page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await this.randomDelay(500, 1000);
  }

  /**
   * 随机移动鼠标（模拟真实用户行为）
   */
  async randomMouseMove() {
    const viewport = this.page.viewportSize();
    if (!viewport) return;

    // 随机移动鼠标 2-4 次
    const moveCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < moveCount; i++) {
      const x = Math.random() * viewport.width;
      const y = Math.random() * viewport.height;

      await this.page.mouse.move(x, y, { steps: 5 + Math.floor(Math.random() * 10) });
      await this.randomDelay(100, 400);
    }
  }

  // ========== 核心功能 ==========

  async init() {
    // 更真实的浏览器配置
    this.browser = await chromium.launch({
      headless: false,
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: [
        '--disable-blink-features=AutomationControlled', // 隐藏自动化特征
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ]
    });

    // 更真实的上下文配置
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 900 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      // 添加额外的权限
      permissions: ['geolocation', 'notifications'],
    });

    this.page = await this.context.newPage();

    // 隐藏 webdriver 标记
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
  }

  async _loadCookies() {
    if (fs.existsSync(this.cookiesFile)) {
      try {
        const cookies = JSON.parse(fs.readFileSync(this.cookiesFile, "utf8"));
        await this.page.goto("https://creator.xiaohongshu.com");
        await this.context.addCookies(cookies);
      } catch (err) {
        console.error("Error loading cookies:", err);
      }
    }
  }

  async _saveCookies() {
    const cookies = await this.context.cookies();
    fs.writeFileSync(this.cookiesFile, JSON.stringify(cookies, null, 2));
  }

  async login(phone, verificationCode = "") {
    if (!this.browser) await this.init();

    // 加载cookies进行登录
    await this.page.goto("https://creator.xiaohongshu.com/login");
    await this._loadCookies();
    await this.page.reload();
    await this.randomDelay(3000, 5000); // 随机延迟

    // 检查是否已经登录
    const currentUrl = this.page.url();
    if (currentUrl !== "https://creator.xiaohongshu.com/login") {
      await this._saveCookies();
      await this.randomDelay(2000, 4000);
      return;
    } else {
      // 清理无效的cookies
      await this.context.clearCookies();
    }

    // 如果cookies登录失败，则进行扫码登录
    await this.page.goto("https://creator.xiaohongshu.com/login");

    // 等待登录页面加载完成
    await this.randomDelay(3000, 4000);

    // 尝试切换到扫码登录方式
    try {
      const qrcodeTab = await this.page.$("text=扫码登录");
      if (qrcodeTab) {
        await this.humanClick(qrcodeTab); // 使用人类点击
        await this.randomDelay(2000, 3000);
      }
    } catch (e) {
      console.log("未找到扫码登录切换按钮，继续等待二维码显示");
    }

    // 等待二维码出现并显示提示
    await this.randomDelay(3000, 4000);
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("📱 请使用小红书 App 扫描屏幕上的二维码登录");
    console.log("═══════════════════════════════════════════════════════════\n");

    // 等待登录成功（最多等待 120 秒）
    try {
      await this.page.waitForURL(url => !url.pathname.includes("/login"), { timeout: 120000 });
      console.log("\n✅ 登录成功！已保存 cookies，以后可以自动登录了\n");
      await this._saveCookies();
      await this.randomDelay(2000, 4000);
    } catch (e) {
      console.error("\n❌ 等待登录超时，请重新运行程序");
      throw new Error("扫码登录超时");
    }
  }

  async postArticle(title, content, images = []) {
    console.log("正在导航到发布页面...");

    // 直接导航到发布页面
    await this.page.goto("https://creator.xiaohongshu.com/publish/publish");
    await this.randomDelay(6000, 10000); // 页面加载时间随机化

    // ========== 进入页面后先"浏览"一下 ==========
    await this.randomDelay(2000, 4000);
    await this.naturalScrolling(); // 自然滚动
    await this.randomMouseMove(); // 随机移动鼠标
    // ===========================================

    // 切换到图文模式 - 这是关键步骤
    console.log("切换到图文模式...");

    // 等待页面加载完成
    await this.randomDelay(2500, 4000);

    // 点击"图文" tab - 使用多种选择器
    const imageTabSelectors = [
      ".tab-item:has-text('图文')",
      "[role='tab']:has-text('图文')",
      "button:has-text('图文')",
      ".tabs :has-text('图文')",
      "[class*='tab']:has-text('图文')"
    ];

    let tabClicked = false;
    for (const selector of imageTabSelectors) {
      try {
        const tab = await this.page.waitForSelector(selector, { timeout: 2000 });
        if (tab) {
          await this.humanClick(tab); // 使用人类点击
          await this.randomDelay(2500, 4000);
          tabClicked = true;
          console.log("✓ 已切换到图文模式");
          break;
        }
      } catch (e) {
        // 继续尝试
      }
    }

    if (!tabClicked) {
      console.log("警告: 未找到图文 tab，可能已经在图文模式");
    }

    // 上传图片
    if (images.length > 0) {
      console.log(`正在上传 ${images.length} 张图片...`);

      try {
        // 等待页面完全加载
        await this.randomDelay(1500, 3000);

        // 查找所有 file input
        const allInputs = await this.page.$$("input[type='file']");

        // 查找接受图片的 input（不包含视频格式）
        let imageInput = null;
        for (const input of allInputs) {
          const accept = await input.evaluate(el => el.accept);
          // 查找接受图片格式或者不明确排除图片的 input
          const isImageInput = accept && (
            accept.includes('image') ||
            accept.includes('png') ||
            accept.includes('jpg') ||
            accept.includes('jpeg') ||
            (!accept.includes('mp4') && !accept.includes('video'))
          );
          if (isImageInput) {
            imageInput = input;
            break;
          }
        }

        // 如果还是找不到，使用最后一个 input
        if (!imageInput && allInputs.length > 0) {
          imageInput = allInputs[allInputs.length - 1];
        }

        if (imageInput) {
          // 逐个上传图片（每张图之间有停顿，模拟真实操作）
          for (let i = 0; i < images.length; i++) {
            console.log(`  上传第 ${i + 1}/${images.length} 张...`);

            // 每次都重新查找 input（页面结构会变化）
            const currentInputs = await this.page.$$("input[type='file']");
            let currentImageInput = null;

            for (const input of currentInputs) {
              const accept = await input.evaluate(el => el.accept);
              const isImageInput = accept && (
                accept.includes('image') ||
                accept.includes('png') ||
                accept.includes('jpg') ||
                accept.includes('jpeg') ||
                (!accept.includes('mp4') && !accept.includes('video'))
              );
              if (isImageInput) {
                currentImageInput = input;
                break;
              }
            }

            if (!currentImageInput && currentInputs.length > 0) {
              currentImageInput = currentInputs[0];
            }

            if (currentImageInput) {
              // 随机移动鼠标后再点击上传
              await this.randomMouseMove();
              await this.randomDelay(500, 1200); // 上传前停顿

              await currentImageInput.setInputFiles(images[i]);

              // 每张图上传后的等待时间随机化
              await this.randomDelay(2500, 4500);
            } else {
              console.log(`    ✗ 第 ${i + 1} 张上传失败：找不到 input`);
              break;
            }
          }
          console.log(`✓ 图片上传完成 (${images.length} 张)`);
          await this.randomDelay(2500, 4000);
        } else {
          console.log("✗ 未找到文件上传输入框");
        }

      } catch (e) {
        console.log("✗ 图片上传异常:", e.message);
      }
    }

    // 输入标题 (限制为20字)
    title = title.substring(0, 20);
    console.log(`正在输入标题: ${title}`);

    // 滚动到顶部
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.randomDelay(800, 1500);

    const titleSelectors = [
      ".d-text",
      "input[placeholder*='标题']",
      "input[placeholder*='填写笔记标题']",
      "[class*='title'] input",
      "input[class*='title']",
      "input[class*='Input']"
    ];

    for (const selector of titleSelectors) {
      try {
        const titleInput = await this.page.waitForSelector(selector, { timeout: 3000 });
        if (titleInput) {
          await this.humanType(titleInput, title); // 使用人类打字
          console.log("标题输入完成");
          break;
        }
      } catch (e) {
        // 继续尝试
      }
    }

    await this.randomDelay(1000, 2500); // 标题输入后停顿

    // 输入内容
    console.log("正在输入内容...");
    const contentSelectors = [
      ".ql-editor",
      "[contenteditable='true']",
      "div[class*='editor']",
      "textarea",
      "[class*='content'] [contenteditable]",
      ".content-input"
    ];

    for (const selector of contentSelectors) {
      try {
        const contentInput = await this.page.waitForSelector(selector, { timeout: 3000 });
        if (contentInput) {
          // 滚动到内容输入区域
          await contentInput.scrollIntoViewIfNeeded();
          await this.randomDelay(500, 1000);

          await this.humanType(contentInput, content); // 使用人类打字
          console.log("内容输入完成");
          break;
        }
      } catch (e) {
        // 继续尝试
      }
    }

    // ========== 发布前最后检查（停顿）==========
    await this.randomDelay(2500, 5000); // 模拟用户最后检查内容
    // 偶尔滚动一下（模拟最后检查）
    if (Math.random() < 0.4) { // 40%概率
      await this.naturalScrolling();
    }
    // ========================================

    // 发布
    console.log("正在点击最终发布按钮...");

    // 只使用最具体的选择器，避免重复点击
    const submitSelectors = [
      "button:has-text('发布')",
      ".publishBtn"
    ];

    let published = false;
    for (const selector of submitSelectors) {
      try {
        const submitBtn = await this.page.waitForSelector(selector, { timeout: 3000 });
        if (submitBtn) {
          await submitBtn.scrollIntoViewIfNeeded();
          await this.randomDelay(800, 1500); // 找到按钮后停顿
          await this.humanClick(submitBtn); // 使用人类点击
          console.log(`✓ 已点击发布按钮`);
          published = true;
          break; // 确保只点击一次
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }

    if (!published) {
      console.log("警告: 未找到发布按钮，请手动点击发布");
    }

    // 等待发布结果
    await this.randomDelay(10000, 15000);

    // 检查是否有错误提示
    try {
      const errorSelector = ".el-message--error, .error-message, [class*='error']";
      const errorMsg = await this.page.$(errorSelector);
      if (errorMsg) {
        const text = await errorMsg.textContent();
        console.log(`\n⚠️  检测到错误提示: ${text}`);
      }
    } catch (e) {
      // 忽略
    }

    console.log("发布流程完成");
  }

  async postVideoArticle(title, content, videos = []) {
    // 视频发布暂时保持原样（未使用）
    await this.page.waitForTimeout(3000);
    const publishBtn = await this.page.waitForSelector(".btn.el-tooltip__trigger.el-tooltip__trigger", { timeout: 10000 });
    await publishBtn.click();

    await this.page.waitForTimeout(3000);
    if (videos.length > 0) {
      const uploadInput = await this.page.$(".upload-input");
      await uploadInput.setInputFiles(videos);
      await this.page.waitForTimeout(1000);
    }
    await this.page.waitForTimeout(3000);

    const titleInput = await this.page.waitForSelector(".d-text", { timeout: 10000 });
    await titleInput.fill(title);

    const contentInput = await this.page.waitForSelector(".ql-editor", { timeout: 10000 });
    await contentInput.fill(content);

    await this.page.waitForTimeout(6000);
    const submitBtn = await this.page.$(".publishBtn");
    await submitBtn.click();

    await this.page.waitForTimeout(3000);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }
}

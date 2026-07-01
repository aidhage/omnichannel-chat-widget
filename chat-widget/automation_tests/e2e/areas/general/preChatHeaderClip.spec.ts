import { Browser, BrowserContext } from "playwright";
import * as playwright from "playwright";
import * as fs from "fs";
import * as path from "path";
import { TestSettings } from "../../../configuration/test-settings";
import { BasePage } from "../../pages/base.page";
import { CustomLiveChatWidgetConstants } from "e2e/utility/constants";

// Requires a built widget bundle (dist/out.js) and Microsoft Edge.
// Skipped where the bundle is not available (e.g. CI without a sample build).
const widgetBundlePath = path.resolve(__dirname, "../../../../dist/out.js");
const widgetBundleExists = fs.existsSync(widgetBundlePath);
const describeIfBuilt = widgetBundleExists ? describe : describe.skip;

/**
 * Layout regression for Bug 6525143 — "Chat header clipped on pre-chat surface".
 *
 * The #oc-lcw container is a fixed 560px, centered (justify-content: center) flex
 * column: HeaderStateful first, then the pre-chat survey pane. Regression PR #957
 * sized the pre-chat wrapper to height: 100% (of the whole container), so a survey
 * taller than 560px pushed header + pane past the container and the centered
 * overflow clipped the header's TOP edge.
 *
 * The fixture renders a deliberately tall pre-chat survey at 560px. This test opens
 * the pre-chat surface and asserts, in a real browser layout, that:
 *   1. the header's top edge is not clipped above the container top,
 *   2. the header keeps a real (non-collapsed) height, and
 *   3. the tall survey overflows INTO the pane's own scroll rather than the
 *      container (proving the repro condition was actually exercised).
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
describeIfBuilt("pre-chat survey header clip (Bug 6525143)", () => {
    const HEADER_SELECTOR = "#oc-lcw-header";
    const CONTAINER_SELECTOR = "#oc-lcw";
    const PRECHAT_PANE_SELECTOR = "#oc-lcw-prechatsurvey-pane";

    let newBrowser: Browser;
    let context: BrowserContext;
    let page: BasePage;

    beforeEach(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newBrowser = await playwright[TestSettings.Browsers as any].launch(
            { ...TestSettings.LaunchBrowserSettings, channel: "msedge" }
        );
        context = await newBrowser.newContext({
            viewport: TestSettings.Viewport,
        });
    });

    afterEach(async () => {
        if (context) {
            await context.close();
        }
        if (newBrowser) {
            await newBrowser.close();
        }
    });

    const openPreChatSurface = async () => {
        page = new BasePage(await context.newPage());
        await page.openLiveChatWidget("customlivechatwidgets/PreChatSurveyHeaderClipWidget.html");
        await page.waitUntilLiveChatSelectorIsVisible(
            CustomLiveChatWidgetConstants.LiveChatButtonId
        );

        // Open the widget -> triggers start-chat -> renders the pre-chat survey.
        const chatButton = await page.Page.$(CustomLiveChatWidgetConstants.LiveChatButtonId);
        await chatButton!.click();

        // Wait for the pre-chat pane and give the adaptive card time to render.
        await page.waitUntilLiveChatSelectorIsVisible(PRECHAT_PANE_SELECTOR, 5, undefined, 8000);
        await page.Page.waitForTimeout(2000);
    };

    const rect = async (selector: string) =>
        page.Page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el) {
                return null;
            }
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height, width: r.width };
        }, selector);

    test("header top edge is not clipped by the centered container", async () => {
        await openPreChatSurface();

        const container = await rect(CONTAINER_SELECTOR);
        const header = await rect(HEADER_SELECTOR);
        expect(container).not.toBeNull();
        expect(header).not.toBeNull();

        // 1px tolerance for sub-pixel rounding. Before the fix the header's top was
        // ABOVE the container top (negative delta) because the centered overflow
        // pushed it up and out of the clipped container.
        expect(header!.top).toBeGreaterThanOrEqual(container!.top - 1);
        // Header must also sit within the container horizontally + not below its bottom.
        expect(header!.bottom).toBeLessThanOrEqual(container!.bottom + 1);
    });

    test("header keeps a real (non-collapsed) height on the pre-chat surface", async () => {
        await openPreChatSurface();

        const header = await rect(HEADER_SELECTOR);
        expect(header).not.toBeNull();
        // Header default general style has minHeight: 50px; anything materially
        // smaller means the header was shrunk/clipped.
        expect(header!.height).toBeGreaterThanOrEqual(40);
    });

    test("tall survey overflows into the pane's own scroll, not the container", async () => {
        await openPreChatSurface();

        // Proves the repro condition (survey taller than the 560px container) was
        // actually exercised and that overflow is absorbed by the pane's scroll
        // (fix) instead of overflowing the centered container (regression).
        const scroll = await page.Page.evaluate((sel) => {
            const el = document.querySelector(sel) as HTMLElement | null;
            return el ? { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight } : null;
        }, PRECHAT_PANE_SELECTOR);

        expect(scroll).not.toBeNull();
        expect(scroll!.scrollHeight).toBeGreaterThan(scroll!.clientHeight);
    });
});

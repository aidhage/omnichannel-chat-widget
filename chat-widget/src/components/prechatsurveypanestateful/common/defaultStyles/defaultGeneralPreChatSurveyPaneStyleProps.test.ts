import { defaultGeneralPreChatSurveyPaneStyleProps as paneStyle } from "./defaultGeneralPreChatSurveyPaneStyleProps";

/**
 * Contract guard for Bug 6525143 / Bug 6423684.
 *
 * The pre-chat survey pane must fill the focus-capture wrapper's remaining space
 * via FLEX rather than a percentage/fixed height:
 *  - Bug 6423684: a bare wrapper left the pane at content size -> collapsed.
 *  - Bug 6525143 (regression from PR #957): `height: 100%` resolved to the whole
 *    560px #oc-lcw container, so header + pane overflowed the centered column and
 *    the header's top was clipped. A percentage height also silently collapses when
 *    an ancestor height is indefinite (docked/mobile/first-paint), reintroducing it.
 *
 * Filling via flex (grow into the flex-resolved space, minHeight: 0 to stay
 * shrinkable so overflowY scroll engages) is robust to both.
 */
describe("defaultGeneralPreChatSurveyPaneStyleProps", () => {
    it("fills remaining space via flex, not a fixed/percentage height", () => {
        expect(paneStyle.flexGrow).toBe(1);
        expect(paneStyle.flexBasis).toBe(0);
        expect(paneStyle.minHeight).toBe(0);
    });

    it("does not hardcode a height that needs a definite ancestor (Bug 6525143 regression source)", () => {
        expect(paneStyle.height).toBeUndefined();
    });

    it("keeps its own vertical scroll so tall surveys scroll instead of overflowing the container", () => {
        expect(paneStyle.overflowY).toBe("auto");
    });
});

import { IStyle } from "@fluentui/react";

export const defaultGeneralPreChatSurveyPaneStyleProps: IStyle = {
    borderStyle: "solid",
    borderRadius: "inherit",
    borderWidth: "0px",
    backgroundColor: "#FFFFFF",
    borderColor: "#F1F1F1",
    overflowY: "auto",
    // Bug 6525143 / Bug 6423684: the focus-capture wrapper is a flex column sized
    // to the space remaining below the header (flex: 1 1 auto). Fill that space via
    // flex (flexGrow: 1 / flexBasis: 0 / minHeight: 0) rather than height: 100%.
    // A percentage height only resolves when every ancestor has a *definite* height
    // (e.g. the 560px #oc-lcw container) and silently collapses to content-size when
    // it doesn't (docked/mobile/first-paint, or after the widget's resize handler
    // hasn't yet stamped a pixel height) - which reintroduced the clip. Flex fill
    // works off the flex-resolved height instead, and minHeight: 0 keeps the pane
    // shrinkable so its overflowY scroll engages for tall surveys instead of pushing
    // the header past the centered container and clipping it.
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 0,
    width: "inherit",
    overscrollBehavior: "none"
};
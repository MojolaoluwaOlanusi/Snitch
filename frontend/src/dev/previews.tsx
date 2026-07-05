import {ComponentPreview, Previews} from "@react-buddy/ide-toolbox";
import {PaletteTree} from "./palette";
import {lazy} from "react";
const ChatPage = lazy(() => import("../pages/chat/ChatPage"));

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/ChatPage">
                <ChatPage/>
            </ComponentPreview>
        </Previews>
    );
};

export default ComponentPreviews;
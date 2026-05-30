import { LoaderIcon } from "lucide-react";
function PageLoader() {
    return (
        <div
            className="flex items-center justify-center h-screen"
            role="status"
            aria-live="polite"
        >
            <LoaderIcon className="size-10 animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading page</span>
        </div>
    );
}
export default PageLoader;

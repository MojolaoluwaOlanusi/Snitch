import { Link } from "react-router-dom";
import { SnitchLogoSmall } from "../../components/svgs/snitch";

const NotFoundPage = () => {
    return (
        <div
            className="min-h-screen bg-cover bg-center flex flex-col justify-center items-center text-white px-4"
            style={{ backgroundImage: `url('/404.png')` }}
        >
            {/* Logo – positioned at top left, with responsive spacing */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                <Link to="/" aria-label="Go to home page">
                    <SnitchLogoSmall />
                </Link>
            </div>

            <main className="text-center z-10 max-w-md">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold mb-4">
                    Lost your way?
                </h1>
                <p className="mb-6 text-base sm:text-lg md:text-xl">
                    Sorry, we can't find that page. You'll find lots to explore on the home page.
                </p>
                <Link to="/" className="btn btn-primary">
                    Snitch Home
                </Link>
            </main>
        </div>
    );
};

export default NotFoundPage;
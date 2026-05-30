import { Link } from "react-router-dom";
import { SnitchLogoSmall} from "../../components/svgs/snitch";

const NotFoundPage = () => {
	return (
		<div
			className='min-h-screen bg-cover bg-center flex flex-col justify-center items-center text-white'
			style={{ backgroundImage: `url('/404.png')` }}
		>
            <div className="top-0 left-0 absolute">
                <Link
                    to={"/"}
                    className="items-center justify-center content-center"
                    aria-label="Go to home page"
                >
                <SnitchLogoSmall />
            </Link>
            </div>
			<main className='text-center error-page--content z-10'>
				<h1 className='text-7xl font-semibold mb-4'>Lost your way?</h1>
				<p className='mb-6 text-xl'>
					Sorry, we can't find that page. You'll find lots to explore on the home page.
				</p>
				<Link to={"/"} className='btn btn-primary'>
					Snitch Home
				</Link>
			</main>
		</div>
	);
};
export default NotFoundPage;

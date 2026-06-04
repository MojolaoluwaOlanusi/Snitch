import Sidebar from "../../components/common/Sidebar";
import {Search} from "lucide-react";
import {Input} from "../../components/common/input"
import {useUserStore} from "../../store/useUserStore";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {useState} from "react";

const SearchPage = () => {

    const [searchType, setSearchType] = useState("all");
    const [showSearchType, setShowSearchType] = useState(false);
    const { searchItem, searchResult, isSearching } = useUserStore();

    console.log(searchResult);

    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar/>
            <div className="flex-col items-center bg-white rounded-lg w-full h-screen">
                <div className="mb-6 p-2">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            onChange={(e) => {
                                e.preventDefault();
                                setShowSearchType(true);
                                if (e.target.value === "") {
                                    setShowSearchType(false);
                                }
                                if (e.target.value !== "") {
                                    searchItem({searchWord: e.target.value, searchType: searchType, limit: 10});
                                }
                            }}
                            placeholder="Search for people, hashtags, mentions, chats, or posts..."
                            className="pl-12 bg-card border-border rounded-xl h-12"
                        />
                    </div>
                    {showSearchType && (
                        <div className="items-center justify-items-center py-2">
                            <header className="items-center justify-content w-full">
                                <div className='flex w-full border-b border-l border-r border-gray-300'>
                                    <div
                                        className='flex justify-center flex-1 p-3 hover:bg-gray-200 rounded-lg transition duration-300 cursor-pointer relative'
                                        onClick={() => setSearchType("all")}
                                    >
                                        <p className="text-black">All</p>
                                        {searchType === "all" && (
                                            <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary'></div>
                                        )}
                                    </div>
                                    <div
                                        className={
                                            "flex justify-center flex-1 p-3 hover:bg-gray-200 rounded-lg transition duration-300 cursor-pointer relative"
                                        }
                                        onClick={() => setSearchType("user")}
                                    >
                                        <p className="text-black">User</p>
                                        {searchType === "user" && (
                                            <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary'></div>
                                        )}
                                    </div>
                                    <div
                                        className='flex justify-center flex-1 p-3 hover:bg-gray-200 rounded-lg transition duration-300 cursor-pointer relative'
                                        onClick={() => setSearchType("post")}
                                    >
                                        <p className="text-black">Post</p>
                                        {searchType === "post" && (
                                            <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary'></div>
                                        )}
                                    </div>
                                    <div
                                        className='flex justify-center flex-1 p-3 hover:bg-gray-200 rounded-lg transition duration-300 cursor-pointer relative'
                                        onClick={() => setSearchType("chat")}
                                    >
                                        <p className="text-black">Chat</p>
                                        {searchType === "chat" && (
                                            <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary'></div>
                                        )}
                                    </div>
                                    <div
                                        className='flex justify-center flex-1 p-3 hover:bg-gray-200 rounded-lg transition duration-300 cursor-pointer relative'
                                        onClick={() => setSearchType("mention")}
                                    >
                                        <p className="text-black">Mention</p>
                                        {searchType === "mention" && (
                                            <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary'></div>
                                        )}
                                    </div>
                                    <div
                                        className='flex justify-center flex-1 p-3 hover:bg-gray-200 rounded-lg transition duration-300 cursor-pointer relative'
                                        onClick={() => setSearchType("hashtag")}
                                    >
                                        <p className="text-black">Hashtag</p>
                                        {searchType === "hashtag" && (
                                            <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary'></div>
                                        )}
                                    </div>
                                </div>
                            </header>
                        </div>
                    )}
                </div>
                <div>
                    <div>
                        {(isSearching) && (
                            <LoadingSpinner size="lg"/>
                        )}
                        {!isSearching && searchResult?.length === 0 && (
                            <p className='text-center my-4'>Search something now</p>
                        )}
                        {/*{ !isSearching && searchResult && (*/}
                        {/*    <div>*/}
                        {/*        {searchResult?.map((item) => (*/}
                        {/*            <p>{item}</p>*/}
                        {/*        ))}*/}
                        {/*    </div>*/}
                        {/*) }*/}
                    </div>
                </div>
            </div>
        </div>
    )
}
export default SearchPage

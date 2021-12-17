import Image from 'next/image'

export const FeaturedGallery = () => {
    return <div>
        <h2 className='text-3xl font-bold py-2'>Your Picks</h2>
        <div className="grid grid-rows-5 grid-flow-col w-full gap-2">
            <img className="row-span-5 col-span-4 h-full object-cover rounded-lg pr-2" src="https://cdn.akamai.steamstatic.com/steam/apps/882100/ss_05da9ecfa48f79eaf04f1efa02043130c81d2b52.600x338.jpg?"></img>
            <img className="strange-shape border-4 border-blue-600" src="https://cdn.akamai.steamstatic.com/steam/apps/882100/header.jpg"></img>
            <img className="strange-shape" src="https://cdn.akamai.steamstatic.com/steam/apps/600480/header_alt_assets_3.jpg"></img>
            <img className="strange-shape" src="https://cdn.akamai.steamstatic.com/steam/apps/1769420/header.jpg"></img>
            <img className="strange-shape" src="https://cdn.akamai.steamstatic.com/steam/apps/457140/header_alt_assets_5.jpg"></img>
            <img className="strange-shape" src="https://cdn.akamai.steamstatic.com/steam/apps/105600/header.jpg"></img>
        </div>
    </div>
}

import React from 'react'

interface MainCardProps{
    location: string;
    items: any;
}

const MainCard: React.FC<MainCardProps> = ({location, items}) => {
  return (
    <div className="snap-center shrink-0 w-8/12 rounded-md border-2 max-w-[300px] border-[#161621] bg-[#1e1e2e] pl-5 pr-5 pt-3 pb-3 flex flex-col">
        <h1 className="text-2xl text-[#F38BA8] mb-1">{location}</h1>
        <ul>
            {items.map((item:any, index:any) => (
            <li key={index}>
                <div className="text-sm">
                    <strong>{item.name}</strong> <br />
                    <p className="text-[#9b9ea1]">{item.description}</p>
                </div>
            </li>
            ))}
        </ul>
    </div>
  )
}

export default MainCard
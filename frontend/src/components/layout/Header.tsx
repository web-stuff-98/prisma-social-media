import { useInterface } from "../../context/InterfaceContext"

export default function Header(){
    const { state: iState } = useInterface()
    return(
        <header style={{textShadow:"1px 2px 4px black"}} className="min-h-header font-bold border-zinc-800 dark:border-zinc-800 bg-gradient-to-t from-indigo-900 to-zinc-900 dark:bg-zinc-900 text-white text-xs flex flex-col items-center justify-center">
            <div className="uppercase text-xl font-extrabold leading-3 mt-2 tracking-tight">
            Prisma-social-media
            </div>
            Group video chat, blog & filesharing 
        </header>
    )
}
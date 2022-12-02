import { useInterface } from "../../context/InterfaceContext"

export default function Header(){
    const { state:iState } = useInterface()

    return(
        <header className="min-h-header tracking-wide border-zinc-800 dark:border-zinc-800 bg-neutral-900 dark:bg-zinc-900 text-white text-xs flex flex-col items-center justify-center">
            <div className="uppercase text-xl font-extrabold leading-6 tracking-tight">
            Prisma-social-media
            </div>
            Group video chat, blog & filesharing 
            {iState.breakPoint}
        </header>
    )
}
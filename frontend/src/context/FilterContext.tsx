import { useContext, createContext, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const FilterContext = createContext<
  | {
      searchTags: string[]
      searchTerm: string
      searchOpen: boolean
      setSearchOpen: (to: boolean) => void
      setSearchTerm: (to: string) => void
      autoAddRemoveSearchTag: (tag: string) => void
      pageCount: number
      fullCount: number
      maxPage: number
      setPageCount: (to: number) => void
      setFullCount: (to: number) => void
      setMaxPage: (to: number) => void
    }
  | any
>(undefined)

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [searchTags, setSearchTags] = useState<string[]>([])
  const [pageCount, setPageCount] = useState(0)
  const [fullCount, setFullCount] = useState(0)
  const [maxPage, setMaxPage] = useState(1)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTermState] = useState('')

  let [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const setSearchTerm = (to: string, dontPush?: boolean) => {
    setSearchTermState(to)
    if (to.trim() !== '') {
      setSearchTags([])
      if (!dontPush)
        navigate(
          `/blog/1?term=${to
            .replaceAll(' ', '+')
            .trim()
            .replace(/[^\w-]+/g, '')}`,
        )
    } else if (!dontPush) {
      navigate('/blog/1')
    }
  }

  const autoAddRemoveSearchTag = (tag: string) => {
    const rawTags = searchParams.get("tags")
    let tags: string[] = []
    if (rawTags)
      tags = String(rawTags)
      .replaceAll(' ', '+')
      .split('+')
        .filter((tag: string) => tag.trim() !== '')
    if (tags.includes(tag.toLowerCase())) {
      tags = tags.filter((t: string) => t !== tag.toLowerCase())
    } else {
      tags = [...tags, tag.toLowerCase()]
    }
    //sort tags alphabetically so that redundant query-props key value pairs for tags are not stored on redis
    //not sure how localeCompare is used to sort alphabetically since i copied it from stack overflow
    tags = tags.sort((a: string, b: string) => a.localeCompare(b))
    setSearchTags(tags)
    navigate(`/blog/1${tags.length > 0 ? `?tags=` + tags.join('+') : ''}`)
  }

  return (
    <FilterContext.Provider
      value={{
        searchTags,
        autoAddRemoveSearchTag,
        setFullCount,
        fullCount,
        setPageCount,
        pageCount,
        maxPage,
        setMaxPage,
        searchTerm,
        setSearchTerm,
        searchOpen,
        setSearchOpen,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export const useFilter = () => useContext(FilterContext)

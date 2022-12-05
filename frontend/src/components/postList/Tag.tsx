import { useFilter } from "../../context/FilterContext"

export default function Tag({tag, isSearchTag}:{tag:string, isSearchTag?:boolean}) {
    const { autoAddRemoveSearchTag, searchTags } = useFilter()

    return <span
    onClick={() => autoAddRemoveSearchTag(tag.trim())}
    key={tag}
    style={
      searchTags.includes(tag) && !isSearchTag
        ? {
            filter: "opacity(0.625) saturate(0.666)",
          }
        : {}
    }
    className="text-xs rounded cursor-pointer bg-gray-900 hover:bg-gray-800 text-white leading-4 hover:bg-gray-600 py-0.5 px-1 sm:py-0 dark:bg-amber-700 dark:hover:bg-amber-600 dark:border-zinc-200 dark:border border border-zinc-300"
  >
    {tag}
  </span>
}
function useLocalStorage(key: string): string | null {
    let value = localStorage.getItem(key)
    if (value) {
        return value
    } else {
        return null
    }
}

export default useLocalStorage
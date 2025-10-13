export default function formatTime(dateString: string | number) {
  const date = new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return date;
}
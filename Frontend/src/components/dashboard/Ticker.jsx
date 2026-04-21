function Ticker({ items = [] }) {
  const tickerItems = items.length ? items : ['No insights yet', 'Update skills to unlock recommendations']
  const doubled = [...tickerItems, ...tickerItems]

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {doubled.map((item, idx) => (
          <span key={`${item}-${idx}`} className="ticker-item">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default Ticker

export default function ProgressBar({ percent }: { percent: number }) {
    return (
      <span
        style={{
          width: '100%',
          height: '4px',
          background: 'linear-gradient(to top, black 0%, rgb(24,24,24) 100%)',
          border: '1px solid black',
          borderRadius: '3px',
          display: 'flex',
        }}
      >
        <span
          style={{
            width: `${percent}%`,
            height: '100%',
            background: 'linear-gradient(to top, green 0%, lime 100%)',
          }}
        />
      </span>
    )
  }

export default function TableSkeleton({ rows = 5, cols = 5, pattern }) {
  // pattern: optional array to vary heights: ["lg","lg","sm","sm","lg"]
  const sizes = { lg: "skel-lg", sm: "skel-sm", md: "" };

  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((__, c) => {
            const sizeKey = pattern?.[c] || (c >= 2 ? "sm" : "lg"); // default: first two bigger
            return (
              <td key={c} className="skel-cell">
                <div className={`skel ${sizes[sizeKey]}`} />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

/** Server-rendered words stay readable without JavaScript; the landing motion enhances them. */
export function ScrollWords({ text }: { text: string }) {
  return (
    <span className="scroll-words" data-scroll-text>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {text.split(" ").map((word, index) => (
          <span className="scroll-word" key={index}>
            <span>{word}</span>{" "}
          </span>
        ))}
      </span>
    </span>
  );
}

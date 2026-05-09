type Props = {
  markdown: string;
};

function renderInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function NewsletterMarkdown({ markdown }: Props) {
  const lines = markdown.split("\n");
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    elements.push(
      <ul key={`list-${elements.length}`} className="list-disc space-y-2 pl-6 text-slate-700">
        {listItems.map((item, idx) => (
          <li key={`${idx}-${item.slice(0, 20)}`} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      continue;
    }

    flushList();

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-xl font-semibold text-slate-900">
          {trimmed.slice(4)}
        </h3>,
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-2xl font-semibold text-slate-900">
          {trimmed.slice(3)}
        </h2>,
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${elements.length}`} className="text-3xl font-semibold text-slate-900">
          {trimmed.slice(2)}
        </h1>,
      );
      continue;
    }

    elements.push(
      <p
        key={`p-${elements.length}`}
        className="leading-7 text-slate-700"
        dangerouslySetInnerHTML={{ __html: renderInline(trimmed) }}
      />,
    );
  }

  flushList();
  return <div className="space-y-5">{elements}</div>;
}

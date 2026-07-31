import "../styles/post-body.css";

interface PostBodyProps {
  html: string;
}

export function PostBody({ html }: PostBodyProps) {
  return (
    <div
      className="post-body max-w-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

import { useEffect, useState } from "react";
import { columns, type Article } from "./components/articlesTable/columns";
import { DataTable } from "./components/articlesTable/table";

import { useQuery } from "@tanstack/react-query";

// async function getData(): Promise<Article[]> {
//   // Здесь можешь заменить на реальный fetch('/api/payments')
//   return [
//     { id: "728ed52f", amount: 100, status: "pending", email: "m@example.com" },
//     { id: "2aa4c91b", amount: 230, status: "success", email: "jane@example.com" },
//   ]
// }

export default function DemoPage() {
  // const [data, setData] = useState<Payment[]>([])
  // const [loading, setLoading] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await fetch("http://localhost:3000/articles")).json(),
  });

  useEffect(() => {
    // getData().then((res) => {
    //   setData(res)
    //   setLoading(false)
    // })
  }, []);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="container mx-auto">
      <DataTable columns={columns} data={data} />
    </div>
  );
}

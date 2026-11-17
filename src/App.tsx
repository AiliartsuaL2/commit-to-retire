export default function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <p className="text-sm text-gray-500">신입 첫 출근, 모니터 앞에서 시작해요</p>
      <h1 className="text-4xl font-bold leading-tight">
        커밋에서
        <br />
        은퇴까지
      </h1>
      <p className="text-gray-600">한 해의 선택이 쌓여 커리어가 돼요.</p>
      <button className="rounded-xl bg-blue-500 py-4 font-semibold text-white" disabled>
        준비 중
      </button>
    </main>
  )
}

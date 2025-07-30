export default function Sucesso() {
	return (
		<div className='flex items-center justify-center min-h-screen'>
			<div className='text-center'>
				<h1 className='text-4xl font-bold text-green-600 mb-4'>
					🎉 Login Realizado com Sucesso!
				</h1>
				<p className='text-lg text-gray-600 mb-8'>
					O sistema de autenticação está funcionando corretamente.
				</p>
				<a
					href='/login'
					className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>
					Voltar ao Login
				</a>
			</div>
		</div>
	);
}

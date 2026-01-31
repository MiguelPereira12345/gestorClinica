import React from 'react'
import RegisterForm from './components/Register/RegisterForm.jsx'
import logoClinimolelos from './assets/Logo-CliniMolelos.png'
import './App.css'
import {
	UserPlus,
} from 'lucide-react'


export default function Register() {
    

	return (
		<div
			className="position-fixed top-0 start-0 w-100 h-100 overflow-auto"
			style={{ background: '#f4f1ec', zIndex: 999 }}
		>
			<div className="container-fluid h-100">
				<div className="row g-0 h-100">
					<section
						className="col-lg-5 d-none d-lg-flex align-items-center justify-content-center bg-white border-end"
						aria-label="Clinimolelos"
					>
						<div className="text-center" style={{ width: '100%', maxWidth: 420 }}>
							<img
								src={logoClinimolelos}
								alt="CLINIMOLELOS"
								decoding="async"
								loading="eager"
								draggable="false"
								className="img-fluid"
								style={{ maxWidth: 360 }}
							/>

							<p className="mt-4 mb-0 text-muted fw-semibold" style={{ fontSize: 15, lineHeight: 1.45 }}>
								Aceda ao sistema clínico para gerir Horários, Consultas, Pacientes e Faturação.
							</p>
						</div>
					</section>

					<section
						className="col-12 col-lg-7 d-flex align-items-center justify-content-center p-3 p-lg-5"
						aria-label="Criar conta"
					>
						<div
							className="ui-card w-100"
							style={{
								maxWidth: 760,
								background: '#fff',
								boxShadow: '0 18px 45px rgba(16, 24, 40, 0.18)',
							}}
						>
							<div className="d-flex align-items-center gap-2 border-bottom px-3 px-lg-4 py-3">
								<UserPlus style={{ width: 18, height: 18 }} aria-hidden="true" />
								<h2 className="m-0 fw-bold" style={{ fontSize: 16 }}>
									Criar Conta
								</h2>
							</div>
							<RegisterForm />
						</div>
					</section>
				</div>
			</div>
		</div>
	)
}


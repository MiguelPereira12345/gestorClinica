import React, { useMemo, useState } from 'react'
import './App.css'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import IdentificacaoPessoal from './components/EditarPaciente/IdentificacaoPessoal'
import HistoricoMedico from './components/EditarPaciente/HistoricoMedico'
import HistoricoDentario from './components/EditarPaciente/HistoricoDentario'
import HabitosEstiloVida from './components/EditarPaciente/HabitosEstiloVida'
import TratamentosResultados from './components/EditarPaciente/TratamentosResultados'
import AnexarExames from './components/EditarPaciente/AnexarExames'
import ObservacoesAdicionais from './components/EditarPaciente/ObservacoesAdicionais'
import {
	buildPatientRecordFromForm,
	getPatientById,
	patientToForm,
	updatePatient,
} from './utils/patientStorage'

export default function EditarPaciente() {
	const navigate = useNavigate()
	const { id } = useParams()
	const patient = useMemo(() => (id ? getPatientById(id) : null), [id])

	const [saving, setSaving] = useState(false)
	const [files, setFiles] = useState(() => {
		const initial = patient?.data?.anexosClinicos
		return Array.isArray(initial) ? initial.map((n) => ({ name: n })) : []
	})
	const [form, setForm] = useState(() => patientToForm(patient))

	function updateField(name, value) {
		setForm((prev) => ({ ...prev, [name]: value }))
	}

	function onPickFiles(event) {
		const list = Array.from(event.target.files || [])
		setFiles((prev) => {
			const existing = new Set(prev.map((f) => f.name))
			const merged = [...prev]
			for (const f of list) {
				if (!existing.has(f.name)) merged.push(f)
			}
			return merged
		})
	}

	function onSubmit(e) {
		e.preventDefault()
		if (saving) return
		if (!patient || !id) return

		const nome = form.nomeCompleto.trim()
		if (!nome) {
			alert('Por favor, preenche o Nome completo.')
			return
		}

		setSaving(true)
		try {
			const anexosClinicos = files.map((f) => f.name)
			const next = buildPatientRecordFromForm({
				id: patient.id,
				createdAt: patient.createdAt,
				estado: patient.estado,
				form,
				anexosClinicos,
			})

			updatePatient(patient.id, () => next)
			navigate(`/pacientes/${patient.id}`)
		} finally {
			setSaving(false)
		}
	}

	if (!patient) {
		return (
			<AppLayout breadcrumb="Pacientes / Editar" userName="Dra. Sofia Lima">
				<div className="patients-content">
					<div className="patients-card" style={{ padding: 16 }}>
						<h2 style={{ margin: 0 }}>Paciente não encontrado</h2>
						<p style={{ marginTop: 8, marginBottom: 16, color: 'rgba(122,130,138,0.95)' }}>
							Este paciente ainda não existe no registo local.
						</p>
						<button className="patient-btn-primary" type="button" onClick={() => navigate('/pacientes')}>
							Voltar à lista
						</button>
					</div>
				</div>
			</AppLayout>
		)
	}

	return (
		<AppLayout breadcrumb={`Pacientes / ${patient.nome} / Editar`} userName="Dra. Sofia Lima">
			<div className="patients-content">
				<div className="patients-title-row">
					<div className="patients-title">
						<h1>Editar paciente</h1>
					</div>
					<div className="patients-title-actions">
						<button className="patient-btn-secondary" type="button" onClick={() => navigate(`/pacientes/${patient.id}`)}>
							Cancelar
						</button>
						<button
							type="submit"
							form="edit-patient-form"
							className="patient-btn-primary"
							disabled={saving}
						>
							{saving ? 'A guardar…' : 'Guardar'}
						</button>
					</div>
				</div>

				<form id="edit-patient-form" className="patient-form" onSubmit={onSubmit}>
					<IdentificacaoPessoal form={form} updateField={updateField} />

					<HistoricoMedico form={form} updateField={updateField} />

					<HistoricoDentario form={form} updateField={updateField} />

					<HabitosEstiloVida form={form} updateField={updateField} />

					<TratamentosResultados form={form} updateField={updateField} />

					<AnexarExames files={files} onPickFiles={onPickFiles} />

					<ObservacoesAdicionais form={form} updateField={updateField} />
				</form>
			</div>
		</AppLayout>
	)
}

import React, { useMemo, useState } from 'react'
import './App.css'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import PageHeader from './components/UI/PageHeader'
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
				<div className="ui-page">
					<div className="ui-card p-3">
						<h2 className="m-0" style={{ fontSize: 18, fontWeight: 800 }}>
							Paciente não encontrado
						</h2>
						<p className="mt-2 mb-3" style={{ color: 'rgba(122,130,138,0.95)' }}>
							Este paciente ainda não existe no registo local.
						</p>
						<button className="btn btn-primary" type="button" onClick={() => navigate('/pacientes')}>
							Voltar à lista
						</button>
					</div>
				</div>
			</AppLayout>
		)
	}

	return (
		<AppLayout breadcrumb={`Pacientes / ${patient.nome} / Editar`} userName="Dra. Sofia Lima">
			<div className="ui-page">
				<PageHeader
					title="Editar paciente"
					subtitle={`${patient.nome} • ${patient.id}`}
					actions={
						<>
							<button className="btn btn-secondary" type="button" onClick={() => navigate(`/pacientes/${patient.id}`)}>
								Cancelar
							</button>
							<button type="submit" form="edit-patient-form" className="btn btn-primary" disabled={saving}>
								{saving ? 'A guardar…' : 'Guardar'}
							</button>
						</>
					}
				/>

				<form id="edit-patient-form" className="d-grid gap-3" onSubmit={onSubmit}>
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

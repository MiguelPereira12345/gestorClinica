import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Eye, FileText, Pencil, Plus } from 'lucide-react'

export default function UtenteActionButtons({
	patient,
	ensurePatientExists = () => true,
	showDependent = true,
	showVer = true,
	showDocs = true,
	showPlanos = true,
	showEditar = true,
	wrap = true,
	className = '',
}) {
	const navigate = useNavigate()
	const id = patient?.id
	const responsavelId = patient?.responsavelId || null

	const content = (
		<>
			{showDependent ? (
				<button
					type="button"
					className="btn btn-light btn-sm"
					onClick={() => {
						if (!ensurePatientExists(patient)) return
						const baseId = responsavelId || id
						navigate(`/pacientes/${baseId}/dependente/novo`)
					}}
					disabled={!id || !!responsavelId}
					title={responsavelId ? 'Adicionar dependentes no responsável' : 'Adicionar dependente'}
				>
					<Plus size={14} aria-hidden="true" />
					Dependente
				</button>
			) : null}

			{showVer ? (
				<button
					type="button"
					className="btn btn-light btn-sm"
					onClick={() => {
						if (!ensurePatientExists(patient)) return
						navigate(`/pacientes/${id}`)
					}}
					disabled={!id}
				>
					<Eye size={14} aria-hidden="true" />
					Ver
				</button>
			) : null}

			{showDocs ? (
				<button
					type="button"
					className="btn btn-light btn-sm"
					onClick={() => {
						if (!ensurePatientExists(patient)) return
						navigate(`/pacientes/${id}/editar#docs`)
					}}
					disabled={!id}
					title="Abrir edição nos anexos clínicos"
				>
					<FileText size={14} aria-hidden="true" />
					Docs
				</button>
			) : null}

			{showPlanos ? (
				<button
					type="button"
					className="btn btn-light btn-sm"
					onClick={() => {
						if (!ensurePatientExists(patient)) return
						navigate(`/pacientes/${id}/planos`)
					}}
					disabled={!id}
					title={responsavelId ? 'Ver planos do dependente' : 'Ver planos de tratamento'}
				>
					<ClipboardList size={14} aria-hidden="true" />
					Planos
				</button>
			) : null}

			{showEditar ? (
				<button
					type="button"
					className="btn btn-light btn-sm"
					onClick={() => {
						if (!ensurePatientExists(patient)) return
						navigate(`/pacientes/${id}/editar`)
					}}
					disabled={!id}
				>
					<Pencil size={14} aria-hidden="true" />
					Editar
				</button>
			) : null}
		</>
	)

	if (!wrap) return content
	return <div className={`ui-actions ${className}`.trim()}>{content}</div>
}

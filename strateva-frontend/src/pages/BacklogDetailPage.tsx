import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { RoleGuard } from '@/components/RoleGuard'
import { BacklogStatusBadge } from '@/features/backlogs/backlogBadges'
import { BacklogItemForm } from '@/features/backlogs/BacklogItemForm'
import {
  useAddBacklogItem,
  useBacklog,
  useCancelBacklog,
  useRemoveBacklogItem,
  useSignBacklog,
  useSubmitBacklog,
  useUpdateBacklogItem,
} from '@/features/backlogs/useBacklogs'
import type { BacklogItemRequestDto, BacklogItemResponseDto } from '@/types/backlog'
import { strings } from '@/lib/strings'

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'd MMMM yyyy', { locale: ru })
  } catch {
    return iso
  }
}

export function BacklogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useBacklog(id)
  const backlogId = id ?? ''

  const addItem = useAddBacklogItem(backlogId)
  const updateItem = useUpdateBacklogItem(backlogId)
  const removeItem = useRemoveBacklogItem(backlogId)
  const submitMutation = useSubmitBacklog()
  const signMutation = useSignBacklog()
  const cancelMutation = useCancelBacklog()

  const [addMode, setAddMode] = useState(false)
  const [editItemId, setEditItemId] = useState<string | null>(null)

  if (isLoading) return <p className="text-sm text-slate-500">{strings.app.loading}</p>
  if (isError || !data) return <p className="text-sm text-red-600">{strings.errors.unknown}</p>

  const itemsMutable = data.status === 'DRAFT'
  const canSubmit = data.status === 'DRAFT' && data.items.length > 0
  const canSign = data.status === 'SUBMITTED'
  const canCancel = data.status === 'DRAFT' || data.status === 'SUBMITTED'
  const t = strings.backlog

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          to="/backlogs"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t.backToList}
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {data.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <BacklogStatusBadge status={data.status} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2" data-testid="backlog-actions">
            <RoleGuard allow={['BUSINESS_ANALYST']}>
              {canSubmit && (
                <Button
                  onClick={() => {
                    if (id && window.confirm(t.actions.confirmSubmit)) {
                      submitMutation.mutate(id)
                    }
                  }}
                  data-testid="action-submit"
                >
                  {t.actions.submitForApproval}
                </Button>
              )}
            </RoleGuard>
            <RoleGuard allow={['PROJECT_MANAGER']}>
              {canSign && (
                <Button
                  onClick={() => {
                    if (id && window.confirm(t.actions.confirmSign)) {
                      signMutation.mutate(id)
                    }
                  }}
                  data-testid="action-sign"
                >
                  {t.actions.sign}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="danger"
                  onClick={() => {
                    if (id && window.confirm(t.actions.confirmCancel)) {
                      cancelMutation.mutate(id)
                    }
                  }}
                  data-testid="action-cancel"
                >
                  {t.actions.cancel}
                </Button>
              )}
            </RoleGuard>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <Field label={t.detail.goalLabel}>{data.goalTitle}</Field>
          <Field label={t.detail.createdAtLabel}>{fmtDate(data.createdAt)}</Field>
          <Field label={t.detail.createdByLabel}>{data.createdBy ?? '—'}</Field>
          {data.submittedAt && (
            <Field label={t.detail.submittedAtLabel}>{fmtDate(data.submittedAt)}</Field>
          )}
          {data.signedAt && (
            <Field label={t.detail.signedAtLabel}>{fmtDate(data.signedAt)}</Field>
          )}
          {data.signedBy && (
            <Field label={t.detail.signedByLabel}>{data.signedBy}</Field>
          )}
          {data.cancelledAt && (
            <Field label={t.detail.cancelledAtLabel}>{fmtDate(data.cancelledAt)}</Field>
          )}
          {data.cancelledBy && (
            <Field label={t.detail.cancelledByLabel}>{data.cancelledBy}</Field>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{t.detail.itemsTitle}</h2>
          <RoleGuard allow={['BUSINESS_ANALYST']}>
            {itemsMutable && !addMode && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditItemId(null)
                  setAddMode(true)
                }}
                data-testid="add-backlog-item"
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> {t.detail.addItem}
              </Button>
            )}
          </RoleGuard>
        </div>

        {itemsMutable && addMode && (
          <BacklogItemForm
            mode="create"
            submitting={addItem.isPending}
            onCancel={() => setAddMode(false)}
            onSubmit={async (values) => {
              await addItem.mutateAsync(values)
              setAddMode(false)
            }}
          />
        )}

        {data.items.length === 0 && !addMode && (
          <p className="text-sm text-slate-500">{t.detail.noItems}</p>
        )}

        <div className="space-y-3">
          {data.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              editable={itemsMutable}
              isEditing={editItemId === item.id}
              onStartEdit={() => {
                setAddMode(false)
                setEditItemId(item.id)
              }}
              onCancelEdit={() => setEditItemId(null)}
              onSave={async (values) => {
                await updateItem.mutateAsync({ itemId: item.id, item: values })
                setEditItemId(null)
              }}
              onRemove={() => {
                if (window.confirm(t.actions.confirmRemoveItem)) {
                  removeItem.mutate(item.id)
                }
              }}
              savingEdit={updateItem.isPending}
            />
          ))}
        </div>

        {itemsMutable && data.items.length === 0 && (
          <p className="text-xs text-slate-500">{t.detail.itemsHint}</p>
        )}
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{children}</p>
    </div>
  )
}

interface ItemRowProps {
  item: BacklogItemResponseDto
  editable: boolean
  isEditing: boolean
  savingEdit: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: (values: BacklogItemRequestDto) => Promise<void>
  onRemove: () => void
}

function ItemRow({
  item,
  editable,
  isEditing,
  savingEdit,
  onStartEdit,
  onCancelEdit,
  onSave,
  onRemove,
}: ItemRowProps) {
  if (isEditing) {
    return (
      <BacklogItemForm
        mode="edit"
        submitting={savingEdit}
        defaultValues={{ title: item.title, description: item.description, priority: item.priority }}
        onCancel={onCancelEdit}
        onSubmit={onSave}
      />
    )
  }
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      data-testid="backlog-item-row"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900">{item.title}</p>
            <Badge variant="neutral">{strings.goals.priority[item.priority]}</Badge>
          </div>
          {item.description && (
            <p className="whitespace-pre-wrap text-sm text-slate-600">{item.description}</p>
          )}
        </div>
        {editable && (
          <RoleGuard allow={['BUSINESS_ANALYST']}>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onStartEdit} data-testid="edit-backlog-item">
                <Pencil className="h-4 w-4" aria-hidden="true" /> {strings.backlog.actions.edit}
              </Button>
              <Button variant="ghost" size="sm" onClick={onRemove} data-testid="remove-backlog-item">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> {strings.backlog.actions.remove}
              </Button>
            </div>
          </RoleGuard>
        )}
      </div>
    </div>
  )
}

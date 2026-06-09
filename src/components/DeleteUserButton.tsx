'use client'

import { useTransition } from 'react'
import { deleteUser } from '@/actions/admin'

export function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`¿Eliminar a ${name}?\nSe borrarán también sus predicciones. Esta acción no se puede deshacer.`)) return
    startTransition(() => deleteUser(userId))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="btn-secondary"
      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
    >
      {isPending ? '⏳' : '🗑 Eliminar'}
    </button>
  )
}

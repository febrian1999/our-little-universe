import { connection } from "next/server";
import { Notice, Field, Select } from "@/components/admin/form";
import { requireRole } from "@/lib/auth";
import { listAccessRequests } from "@/lib/db/repositories/access-requests";
import { listInvites } from "@/lib/db/repositories/invites";
import { listUsers } from "@/lib/db/repositories/users";
import {
  createInviteAction,
  decideRequestAction,
  revokeInviteAction,
  revokeUserAction,
  updateUserRoleAction,
} from "./actions";

export const instant = false;

function when(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function AccessPage(props: PageProps<"/admin/access">) {
  const me = await requireRole("owner");
  await connection();
  const query = await props.searchParams;
  const [requests, invites, users] = await Promise.all([
    listAccessRequests(),
    listInvites(),
    listUsers(),
  ]);
  const pending = requests.filter((row) => row.status === "pending");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Akses
      </h1>
      <Notice
        error={typeof query.error === "string" ? query.error : undefined}
        ok={typeof query.ok === "string" ? query.ok : undefined}
      />

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-neutral-900">
          Permintaan menunggu ({pending.length})
        </h2>
        <ul className="mt-4 space-y-3">
          {pending.map((request) => (
            <li
              key={request.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm"
            >
              <p className="font-semibold text-neutral-900">
                {request.name}{" "}
                <span className="font-normal text-neutral-500">
                  · {request.email}
                </span>
              </p>
              {request.message ? (
                <p className="mt-1 text-neutral-600">{request.message}</p>
              ) : null}
              <p className="mt-1 text-xs text-neutral-400">
                {when(request.createdAt)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={decideRequestAction}>
                  <input type="hidden" name="id" value={request.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <button
                    type="submit"
                    className="tap rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
                  >
                    Setujui
                  </button>
                </form>
                <form action={decideRequestAction} className="flex gap-2">
                  <input type="hidden" name="id" value={request.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <input
                    name="reason"
                    placeholder="Alasan (opsional)"
                    className="rounded-full border border-neutral-300 px-4 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="tap rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700"
                  >
                    Tolak
                  </button>
                </form>
              </div>
            </li>
          ))}
          {pending.length === 0 ? (
            <li className="text-sm text-neutral-500">
              Tidak ada permintaan menunggu.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">Undangan</h2>
        <form
          action={createInviteAction}
          className="mt-4 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-4"
        >
          <Field label="Email penerima (opsional)" name="email" type="email" />
          <Select
            label="Role"
            name="role"
            defaultValue="editor"
            options={[
              { value: "editor", label: "editor" },
              { value: "owner", label: "owner" },
            ]}
          />
          <Field label="Berlaku (hari)" name="days" type="number" defaultValue="7" />
          <button type="submit" className="btn-primary self-end px-6">
            Buat kode
          </button>
        </form>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-2">Kode</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Pakai</th>
                <th className="px-4 py-2">Kedaluwarsa</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const active =
                  invite.uses < invite.maxUses &&
                  (!invite.expiresAt || invite.expiresAt > new Date());
                return (
                  <tr key={invite.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2 font-mono font-semibold text-neutral-900">
                      {invite.code}
                    </td>
                    <td className="px-4 py-2 text-neutral-600">
                      {invite.email ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-neutral-600">{invite.role}</td>
                    <td className="px-4 py-2 text-neutral-600">
                      {invite.uses}/{invite.maxUses}
                    </td>
                    <td className="px-4 py-2 text-neutral-600">
                      {when(invite.expiresAt)}
                    </td>
                    <td className="px-4 py-2">
                      {active ? (
                        <form action={revokeInviteAction}>
                          <input type="hidden" name="id" value={invite.id} />
                          <button
                            type="submit"
                            className="tap rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700"
                          >
                            Cabut
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-neutral-400">nonaktif</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {invites.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-neutral-500" colSpan={6}>
                    Belum ada undangan.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">Pengguna</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Login terakhir</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 font-semibold text-neutral-900">
                    {row.displayName}
                    {row.id === me.id ? (
                      <span className="ml-2 text-xs text-neutral-400">(kamu)</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{row.email}</td>
                  <td className="px-4 py-2 text-neutral-600">
                    {when(row.lastLoginAt)}
                  </td>
                  <td className="px-4 py-2">
                    <form action={updateUserRoleAction} className="flex gap-2">
                      <input type="hidden" name="id" value={row.id} />
                      <select
                        name="role"
                        defaultValue={row.role}
                        className="rounded-xl border border-neutral-300 px-2 py-1 text-sm"
                      >
                        <option value="owner">owner</option>
                        <option value="editor">editor</option>
                        {row.role === "guest" ? (
                          <option value="guest">guest</option>
                        ) : null}
                      </select>
                      <button
                        type="submit"
                        className="tap rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700"
                      >
                        Simpan
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    {row.id === me.id ? null : (
                      <form action={revokeUserAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <button
                          type="submit"
                          className="tap rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-600"
                        >
                          Cabut
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-neutral-500" colSpan={5}>
                    Belum ada pengguna.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

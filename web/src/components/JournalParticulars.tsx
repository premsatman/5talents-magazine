import { publisherLines, type Publisher, type Particulars } from '@/lib/publisher'

/**
 * The journal particulars block.
 *
 * Section 6 of the ISSN India detailed information document asks for these
 * exact rows on the publication's opening page: title, frequency, ISSN,
 * publisher name, publisher address, starting year, subject, language,
 * publication format, email, mobile. They are rendered as a definition-style
 * table rather than prose so an assessor can find every one of them at a
 * glance, which is the whole point of the requirement.
 *
 * Rows with no value are dropped rather than shown empty. An empty row reads
 * as a missing answer; a dropped one reads as a shorter table. The ISSN row is
 * the one that stays absent longest, because it cannot be filled until the
 * number is allotted.
 */
export function JournalParticulars({
  title,
  publisher,
  particulars,
}: {
  title?: string | null
  publisher?: Publisher
  particulars?: Particulars
}) {
  const address = publisherLines(publisher).join(', ')
  const languages = (particulars?.languages ?? []).filter(Boolean).join(', ')

  const rows: Array<[string, string | null | undefined]> = [
    ['Title', title],
    ['Frequency', particulars?.frequency],
    ['e-ISSN (online)', particulars?.issnOnline],
    ['ISSN (print)', particulars?.issnPrint],
    ['Publisher name', publisher?.name],
    ['Publisher address', address || null],
    ['Starting year', particulars?.startYear ? String(particulars.startYear) : null],
    ['Subject', particulars?.subject],
    ['Language', languages || null],
    ['Publication format', particulars?.format],
    ['Email', publisher?.email],
    ['Mobile', publisher?.mobile],
  ]

  const filled = rows.filter(([, value]) => Boolean(value))
  if (filled.length === 0) return null

  return (
    <div className="table-scroll">
      <table className="ratecard particulars">
        <caption className="visually-hidden">Journal particulars for 5Talents Magazine</caption>
        <tbody>
          {filled.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>
                {label === 'Email' && value ? <a href={`mailto:${value}`}>{value}</a> : value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

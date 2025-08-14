interface CardProps {
  title: string
  description: string
  link?: string
}

export default function Card({ title, description, link }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {link && (
        <a
          href={link}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Learn more →
        </a>
      )}
    </div>
  )
} 
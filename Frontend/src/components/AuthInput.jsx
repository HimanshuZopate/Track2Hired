import { motion as Motion } from 'framer-motion'

function AuthInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  error,
  icon: Icon,
  rightElement,
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-almond/90">
        {label}
      </label>
      <Motion.div whileFocusWithin={{ scale: 1.01 }} className="relative">
        {Icon ? (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
          />
        ) : null}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          className={`auth-input w-full rounded-xl border bg-white/[0.03] py-3 text-sm text-almond placeholder:text-white/35 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 ${
            Icon ? 'pl-10' : 'pl-3'
          } ${rightElement ? 'pr-11' : 'pr-3'} ${
            error
              ? 'border-red-400/70 shadow-[0_0_0_1px_rgba(248,113,113,0.45),0_0_18px_rgba(248,113,113,0.32)]'
              : 'border-white/12'
          }`}
        />
        {rightElement ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        ) : null}
      </Motion.div>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  )
}

export default AuthInput

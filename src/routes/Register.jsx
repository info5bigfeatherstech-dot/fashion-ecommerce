import Account from './Account'

export default function Register() {
  return <Account initialAuthMode="register" initialActiveTab="orders" authGateMode="modal" />
}


import type { setingCompanyDTO } from '@/types/dto'

export const settingCompany = () => {
  const { $api } = useNuxtApp()
  const profileStore = useProfileStore()
  console.log('Get List from data ::::: ', profileStore.companyId)
  const ENDPOINT = {
    CompanyDetail: `settings/company-profile/${profileStore.companyId}/get-profile`,
    profile: `/me/profile`,
    updateProfile: `/me/profile`,
    update: `/settings/company-profile/${profileStore.companyId}/update-detail`,
    updateRepre: `/settings/company-profile/${profileStore.companyId}/update-representative`,
    updateImage: `/me/logo`,
    changePassword: `/me/change-password`,
    removeProfile: `/syncra/api/v1/settings/company-profile/${profileStore.companyId}/remove-profile`,
  } as const

  const getCompanyProfile = () => {
    return $api<setingCompanyDTO.setingCompany>(ENDPOINT.CompanyDetail, {
      method: 'GET',
    })
  }
  const getUserProfile = () => {
    return $api<setingCompanyDTO.dataProfile>(ENDPOINT.profile, {
      method: 'GET',
    })
  }
  const updateCompanyDetail = (body: setingCompanyDTO.CompanyDetailResponse) => {
    return $api(ENDPOINT.update, {
      method: 'PUT',
      body,
    })
  }

  const updateCompanyRepresentative = (body: setingCompanyDTO.CompanyRepresentativeResponse) => {
    return $api(ENDPOINT.updateRepre, {
      method: 'PUT',
      body,
    })
  }
  const updateProfiledata = (body: setingCompanyDTO.UpdateProfileNameDto) => {
    return $api(ENDPOINT.updateProfile, {
      method: 'POST',
      body,
    })
  }
  const changePasswordStore = (body: setingCompanyDTO.changePasswordDto) => {
    return $api(ENDPOINT.changePassword, {
      method: 'POST',
      body,
    })
  }
  const updateProfileImage = async (body: FormData) => {
    return $api(ENDPOINT.updateImage, {
      method: 'POST',
      body,
    })
  }
  const removeCompanyProfileImage = async (body: FormData) => {
    return $api(ENDPOINT.removeProfile, {
      method: 'DELETE',
      body,
    })
  }
  return {
    getCompanyProfile,
    getUserProfile,
    updateCompanyDetail,
    updateCompanyRepresentative,
    updateProfileImage,
    removeCompanyProfileImage,
    updateProfiledata,
    changePasswordStore,
  }
}
